'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { productsAPI, categoriesAPI } from '@/lib/api';
import { ArrowLeft, Upload, FileSpreadsheet, CheckCircle2, AlertCircle, X } from 'lucide-react';
import Link from 'next/link';
import { showToast } from '@/lib/toast';
import { formatCurrency } from '@/lib/utils';
import * as XLSX from 'xlsx';

interface Category {
  _id: string;
  name: string;
  code: string;
}

interface UploadResult {
  created: number;
  updated?: number;
  total: number;
  errors?: string[];
  products?: Array<{ _id: string; name: string; sku: string }>;
  updatedProducts?: Array<{
    _id: string;
    name: string;
    sku: string;
    previousStock: number;
    newStock: number;
  }>;
  lot?: {
    _id: string;
    lotNumber: string;
    uploadDate: string;
    productCount: number;
    totalStockValue: number;
  };
}

export default function UploadProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any[]>([]);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [updateStock, setUpdateStock] = useState(false);

  // Load categories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await categoriesAPI.getAll();
        setCategories(data || []);
        
        // If categoryId is in URL params, set it as selected
        const categoryIdFromUrl = searchParams?.get('categoryId');
        if (categoryIdFromUrl) {
          setSelectedCategory(categoryIdFromUrl);
        }
      } catch (error) {
        console.error('Error loading categories:', error);
        showToast.error('Failed to load categories');
      } finally {
        setLoadingCategories(false);
      }
    };
    loadCategories();
  }, [searchParams]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv', // .csv
    ];

    if (!validTypes.includes(selectedFile.type) && !selectedFile.name.match(/\.(xlsx|xls|csv)$/i)) {
      showToast.error('Please select a valid Excel file (.xlsx, .xls, or .csv)');
      return;
    }

    setFile(selectedFile);
    setUploadResult(null);

    // Preview Excel data
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        // Show first 5 rows as preview
        setPreview(jsonData.slice(0, 6) as any[]);
      } catch (error) {
        console.error('Error reading file:', error);
        showToast.error('Failed to read Excel file');
      }
    };
    reader.readAsArrayBuffer(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) {
      showToast.error('Please select an Excel file');
      return;
    }

    if (!selectedCategory) {
      showToast.error('Please select a category');
      return;
    }

    try {
      setLoading(true);
      setUploadResult(null);

      // Read file as base64
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const base64 = event.target?.result as string;

          const result = await productsAPI.uploadExcel(base64, selectedCategory, updateStock);

          setUploadResult({
            created: result.created || 0,
            total: result.total || 0,
            errors: result.errors,
            products: result.products,
            lot: result.lot,
          });

          if (result.created > 0) {
            showToast.success(`Successfully uploaded ${result.created} product(s)!`);
          }

          if (result.errors && result.errors.length > 0) {
            showToast.error(`${result.errors.length} row(s) had errors. Check details below.`);
          }
        } catch (error: any) {
          console.error('Upload error:', error);
          showToast.error('Failed to upload products: ' + (error.message || 'Unknown error'));
        } finally {
          setLoading(false);
        }
      };

      reader.onerror = () => {
        showToast.error('Failed to read file');
        setLoading(false);
      };

      reader.readAsDataURL(file);
    } catch (error: any) {
      console.error('Upload error:', error);
      showToast.error('Failed to upload: ' + (error.message || 'Unknown error'));
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreview([]);
    setUploadResult(null);
    setSelectedCategory('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/products">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Upload Products from Excel</h1>
          <p className="text-gray-600 mt-1">Bulk import products from Excel file</p>
        </div>
      </div>

      {/* Instructions */}
      <Card className="border-0 shadow-md bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-blue-600" />
            Excel File Format
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-gray-700">
            <p><strong>Required columns:</strong> Product Name, Category, Cost Price (Hidden), Selling Price, Current Stock</p>
            <p><strong>Optional columns:</strong> Product Code (used as SKU if provided), Stock Unit, MRP (₹), <strong>GST Percentage</strong> (e.g., 12, 18, 28)</p>
            <p><strong>Note:</strong> If Product Code is provided (e.g., LP-PT-001), it will be used as SKU. Otherwise, SKU will be auto-generated.</p>
            <p className="text-xs text-blue-700 font-medium mt-2">
              💡 <strong>GST Percentage Column:</strong> Use column name "GST Percentage" or "GST%" in your Excel. Enter numeric values only (e.g., 12 for 12%, 18 for 18%). This will be used for automatic GST calculation during billing.
            </p>
            <p className="text-xs text-gray-600 mt-2">
              Categories from Excel will be auto-created if they don't exist. Product Code format: LP-XX-XXX
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Upload Form */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>Upload Excel File</CardTitle>
          <CardDescription>Select category and upload your Excel file</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Category Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Category <span className="text-red-500">*</span>
            </label>
            {loadingCategories ? (
              <div className="text-sm text-gray-500">Loading categories...</div>
            ) : (
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
                required
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name} ({cat.code})
                  </option>
                ))}
              </select>
            )}
            <p className="text-xs text-gray-500">
              Select the category for products in this Excel file. Category from Excel column will override this if present.
            </p>
          </div>

          {/* Update Stock Option */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={updateStock}
                onChange={(e) => setUpdateStock(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                disabled={loading}
              />
              <span className="text-sm font-medium text-gray-700">
                Update Stock for Existing Products
              </span>
            </label>
            <p className="text-xs text-gray-500 ml-6">
              If checked, existing products (matched by Product Code) will have their stock updated. New products will still be created.
            </p>
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Excel File <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-4">
              <label className="flex-1">
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={loading}
                />
                <div className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                  {file ? (
                    <div className="text-center">
                      <FileSpreadsheet className="mx-auto h-8 w-8 text-green-600 mb-2" />
                      <p className="text-sm font-medium text-gray-900">{file.name}</p>
                      <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600">Click to select Excel file</p>
                      <p className="text-xs text-gray-500">.xlsx, .xls, or .csv</p>
                    </div>
                  )}
                </div>
              </label>
            </div>
          </div>

          {/* Preview */}
          {preview.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Preview (First 5 rows)</label>
              <div className="border rounded-lg overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      {preview[0]?.map((header: any, idx: number) => (
                        <th key={idx} className="px-3 py-2 text-left font-semibold text-gray-700 border-b">
                          {header || `Column ${idx + 1}`}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.slice(1).map((row: any, rowIdx: number) => (
                      <tr key={rowIdx} className="border-b">
                        {row.map((cell: any, cellIdx: number) => (
                          <td key={cellIdx} className="px-3 py-2 text-gray-700">
                            {cell || '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Upload Button */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleUpload}
              disabled={!file || !selectedCategory || loading}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Upload className="mr-2 h-4 w-4" />
              {loading ? 'Uploading...' : 'Upload Products'}
            </Button>
            {(file || uploadResult) && (
              <Button onClick={handleReset} variant="outline" disabled={loading}>
                Reset
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Upload Results */}
      {uploadResult && (
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {uploadResult.created > 0 ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
              Upload Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600">Successfully Created</p>
                <p className="text-2xl font-bold text-green-600">{uploadResult.created}</p>
                <p className="text-xs text-gray-500">new products</p>
              </div>
              {uploadResult.updated && uploadResult.updated > 0 && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600">Stock Updated</p>
                  <p className="text-2xl font-bold text-blue-600">{uploadResult.updated}</p>
                  <p className="text-xs text-gray-500">existing products</p>
                </div>
              )}
              {uploadResult.errors && uploadResult.errors.length > 0 && (
                <div className="p-4 bg-red-50 rounded-lg">
                  <p className="text-sm text-gray-600">Errors</p>
                  <p className="text-2xl font-bold text-red-600">{uploadResult.errors.length}</p>
                  <p className="text-xs text-gray-500">rows with issues</p>
                </div>
              )}
            </div>

            {/* Error List */}
            {uploadResult.errors && uploadResult.errors.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Error Details</label>
                <div className="max-h-48 overflow-y-auto border rounded-lg p-3 bg-red-50">
                  {uploadResult.errors.map((error, idx) => (
                    <div key={idx} className="text-sm text-red-700 py-1">
                      {error}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Created Products */}
            {uploadResult.products && uploadResult.products.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Created Products (Sample)</label>
                <div className="max-h-48 overflow-y-auto border rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">Name</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">SKU</th>
                      </tr>
                    </thead>
                    <tbody>
                      {uploadResult.products.slice(0, 10).map((product) => (
                        <tr key={product._id} className="border-b">
                          <td className="px-3 py-2 text-gray-700">{product.name}</td>
                          <td className="px-3 py-2 font-mono text-gray-700">{product.sku}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {uploadResult.products.length > 10 && (
                    <p className="text-xs text-gray-500 p-2 text-center">
                      Showing first 10 of {uploadResult.products.length} products
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* LOT Information */}
            {uploadResult.lot && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700">LOT Created</p>
                    <p className="text-lg font-bold text-blue-600 mt-1">{uploadResult.lot.lotNumber}</p>
                    <p className="text-xs text-gray-600 mt-1">
                      {uploadResult.lot.productCount} products • {formatCurrency(uploadResult.lot.totalStockValue)} stock value
                    </p>
                  </div>
                  <Link href={`/lots/${uploadResult.lot._id}`}>
                    <Button variant="outline" size="sm">
                      View LOT
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Link href="/products" className="flex-1">
                <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  View Products
                </Button>
              </Link>
              {uploadResult.lot && (
                <Link href={`/lots/${uploadResult.lot._id}`} className="flex-1">
                  <Button variant="outline" className="w-full">
                    View LOT Details
                  </Button>
                </Link>
              )}
              <Button onClick={handleReset} variant="outline" className="flex-1">
                Upload Another File
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

