'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { stockAuditAPI } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  Search,
  Plus,
  CheckCircle2,
  X,
  AlertCircle,
  Package,
  ScanLine,
  Save,
  Trash2,
  Play,
  Square,
} from 'lucide-react';
import { showToast, showConfirm } from '@/lib/toast';

interface AuditItem {
  productId: string;
  productName: string;
  sku: string;
  systemStock: number;
  physicalStock: number;
  difference: number;
  notes?: string;
}

interface Audit {
  _id: string;
  auditNumber: string;
  auditDate: string;
  status: 'in_progress' | 'completed' | 'cancelled';
  items: AuditItem[];
  totalProducts: number;
  discrepancies: number;
  notes?: string;
}

export default function StockAuditPage() {
  const router = useRouter();
  const [currentAudit, setCurrentAudit] = useState<Audit | null>(null);
  const [loading, setLoading] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [physicalStockInput, setPhysicalStockInput] = useState('');
  const [notesInput, setNotesInput] = useState('');
  const [scanning, setScanning] = useState(false);
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const barcodeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle external barcode scanner input
  useEffect(() => {
    if (barcodeInputRef.current && scanning) {
      barcodeInputRef.current.focus();
    }
  }, [scanning]);

  // Process barcode scanner input
  useEffect(() => {
    if (!barcodeInput || !scanning || !currentAudit) return;

    if (barcodeTimeoutRef.current) {
      clearTimeout(barcodeTimeoutRef.current);
    }

    barcodeTimeoutRef.current = setTimeout(async () => {
      if (barcodeInput.length > 0) {
        await handleBarcodeScan(barcodeInput.trim());
        setBarcodeInput('');
      }
    }, 150);

    return () => {
      if (barcodeTimeoutRef.current) {
        clearTimeout(barcodeTimeoutRef.current);
      }
    };
  }, [barcodeInput, scanning, currentAudit]);

  const startNewAudit = async () => {
    try {
      setLoading(true);
      const audit = await stockAuditAPI.create();
      setCurrentAudit(audit);
      setScanning(true);
      showToast.success('New audit session started! Start scanning products.');
    } catch (error: any) {
      showToast.error('Failed to start audit: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleBarcodeScan = async (sku: string) => {
    if (!currentAudit) return;

    try {
      // If physical stock is not entered, just store the SKU and focus on stock input
      if (!physicalStockInput || physicalStockInput === '') {
        showToast.info(`Scanned: ${sku}. Please enter physical stock count.`);
        // Focus on physical stock input
        const stockInput = document.getElementById('physicalStock');
        if (stockInput) {
          (stockInput as HTMLInputElement).focus();
        }
        return;
      }

      const physicalStock = parseInt(physicalStockInput, 10);
      if (isNaN(physicalStock) || physicalStock < 0) {
        showToast.error('Please enter a valid stock count');
        return;
      }

      const result = await stockAuditAPI.addItem(currentAudit._id, {
        sku,
        physicalStock,
        notes: notesInput || undefined,
      });

      // Update current audit
      const updatedAudit = await stockAuditAPI.getById(currentAudit._id);
      setCurrentAudit(updatedAudit);

      // Clear inputs
      setPhysicalStockInput('');
      setNotesInput('');
      setBarcodeInput('');

      // Show result
      if (result.item.difference === 0) {
        showToast.success(`${result.item.productName}: Stock matches (${result.item.physicalStock})`);
      } else if (result.item.difference > 0) {
        showToast.success(
          `${result.item.productName}: +${result.item.difference} (System: ${result.item.systemStock}, Physical: ${result.item.physicalStock})`
        );
      } else {
        showToast.info(
          `${result.item.productName}: ${result.item.difference} (System: ${result.item.systemStock}, Physical: ${result.item.physicalStock})`
        );
      }

      // Refocus barcode input for next scan
      if (barcodeInputRef.current) {
        barcodeInputRef.current.focus();
      }
    } catch (error: any) {
      showToast.error('Failed to add item: ' + (error.message || 'Unknown error'));
      setBarcodeInput('');
    }
  };

  const handleManualAdd = async () => {
    if (!barcodeInput || !currentAudit) {
      showToast.error('Please enter SKU');
      return;
    }

    if (!physicalStockInput) {
      showToast.error('Please enter physical stock count');
      return;
    }

    await handleBarcodeScan(barcodeInput);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, field: 'barcode' | 'stock' | 'notes') => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (field === 'barcode' && barcodeInput) {
        // Move to stock input
        const stockInput = document.getElementById('physicalStock');
        if (stockInput) {
          (stockInput as HTMLInputElement).focus();
        }
      } else if (field === 'stock' && barcodeInput && physicalStockInput) {
        // Add to audit
        handleManualAdd();
      } else if (field === 'notes' && barcodeInput && physicalStockInput) {
        // Add to audit
        handleManualAdd();
      }
    }
  };

  const removeItem = async (productId: string) => {
    if (!currentAudit) return;

    const confirmed = await showConfirm('Remove this item from audit?');
    if (!confirmed) return;

    try {
      await stockAuditAPI.removeItem(currentAudit._id, productId);
      const updatedAudit = await stockAuditAPI.getById(currentAudit._id);
      setCurrentAudit(updatedAudit);
      showToast.success('Item removed from audit');
    } catch (error: any) {
      showToast.error('Failed to remove item: ' + (error.message || 'Unknown error'));
    }
  };

  const completeAudit = async (applyAdjustments: boolean = false) => {
    if (!currentAudit) return;

    const message = applyAdjustments
      ? 'Complete audit and apply stock adjustments? This will update product stock quantities.'
      : 'Complete audit without applying adjustments?';

    const confirmed = await showConfirm(message);
    if (!confirmed) return;

    try {
      setLoading(true);
      await stockAuditAPI.complete(currentAudit._id, applyAdjustments);
      showToast.success(
        applyAdjustments
          ? 'Audit completed and stock adjustments applied!'
          : 'Audit completed successfully!'
      );
      setCurrentAudit(null);
      setScanning(false);
    } catch (error: any) {
      showToast.error('Failed to complete audit: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const cancelAudit = async () => {
    if (!currentAudit) return;

    const confirmed = await showConfirm('Cancel this audit session? All scanned items will be lost.');
    if (!confirmed) return;

    try {
      setLoading(true);
      await stockAuditAPI.cancel(currentAudit._id);
      showToast.success('Audit cancelled');
      setCurrentAudit(null);
      setScanning(false);
    } catch (error: any) {
      showToast.error('Failed to cancel audit: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Stock Audit</h1>
          <p className="text-gray-600 mt-1">Physical stock counting via barcode scanning</p>
        </div>
        {!currentAudit && (
          <Button
            onClick={startNewAudit}
            disabled={loading}
            className="bg-gradient-to-r from-blue-600 to-purple-600"
          >
            <Plus className="mr-2 h-4 w-4" />
            Start New Audit
          </Button>
        )}
      </div>

      {!currentAudit ? (
        /* No Active Audit */
        <Card className="border-0 shadow-md">
          <CardContent className="py-12">
            <div className="text-center">
              <Package className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Audit</h3>
              <p className="text-gray-600 mb-6">
                Start a new stock audit session to begin physical stock counting
              </p>
              <Button
                onClick={startNewAudit}
                disabled={loading}
                className="bg-gradient-to-r from-blue-600 to-purple-600"
              >
                <Play className="mr-2 h-4 w-4" />
                Start Audit Session
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Active Audit Session */
        <>
          {/* Audit Info */}
          <Card className="border-0 shadow-md bg-blue-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Audit Number</p>
                  <p className="text-2xl font-bold text-blue-600">{currentAudit.auditNumber}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Started: {formatDate(currentAudit.auditDate)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Products Scanned</p>
                  <p className="text-2xl font-bold text-gray-900">{currentAudit.totalProducts}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {currentAudit.discrepancies} with discrepancies
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Scanning Interface */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ScanLine className="h-5 w-5" />
                Scan Products
              </CardTitle>
              <CardDescription>
                Scan barcode or enter SKU, then enter physical stock count
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="barcode">SKU / Barcode</Label>
                  <Input
                    ref={barcodeInputRef}
                    id="barcode"
                    type="text"
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, 'barcode')}
                    placeholder="Scan or enter SKU"
                    className="font-mono h-12 text-lg"
                    autoFocus
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="physicalStock">Physical Stock *</Label>
                  <Input
                    id="physicalStock"
                    type="number"
                    value={physicalStockInput}
                    onChange={(e) => setPhysicalStockInput(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, 'stock')}
                    placeholder="Enter count"
                    className="h-12 text-lg"
                    min="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Input
                    id="notes"
                    type="text"
                    value={notesInput}
                    onChange={(e) => setNotesInput(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, 'notes')}
                    placeholder="Add notes"
                    className="h-12"
                  />
                </div>
              </div>

              <Button
                onClick={handleManualAdd}
                disabled={!barcodeInput || !physicalStockInput}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600"
              >
                <ScanLine className="mr-2 h-4 w-4" />
                Add to Audit
              </Button>
            </CardContent>
          </Card>

          {/* Audit Items */}
          {currentAudit.items.length > 0 && (
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle>Scanned Items ({currentAudit.items.length})</CardTitle>
                <CardDescription>
                  {currentAudit.discrepancies} item(s) with stock discrepancies
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-4 font-semibold text-gray-700">Product</th>
                        <th className="text-left p-4 font-semibold text-gray-700">SKU</th>
                        <th className="text-right p-4 font-semibold text-gray-700">System Stock</th>
                        <th className="text-right p-4 font-semibold text-gray-700">Physical Stock</th>
                        <th className="text-right p-4 font-semibold text-gray-700">Difference</th>
                        <th className="text-center p-4 font-semibold text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentAudit.items.map((item, index) => (
                        <tr
                          key={`${item.productId}-${index}`}
                          className={`border-b ${
                            item.difference !== 0 ? 'bg-yellow-50' : 'hover:bg-gray-50'
                          }`}
                        >
                          <td className="p-4 font-medium text-gray-900">{item.productName}</td>
                          <td className="p-4">
                            <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                              {item.sku}
                            </span>
                          </td>
                          <td className="p-4 text-right text-gray-700">{item.systemStock}</td>
                          <td className="p-4 text-right font-semibold text-gray-900">
                            {item.physicalStock}
                          </td>
                          <td className="p-4 text-right">
                            {item.difference === 0 ? (
                              <span className="text-green-600 font-semibold">✓ Match</span>
                            ) : item.difference > 0 ? (
                              <span className="text-blue-600 font-semibold">
                                +{item.difference}
                              </span>
                            ) : (
                              <span className="text-red-600 font-semibold">{item.difference}</span>
                            )}
                          </td>
                          <td className="p-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeItem(item.productId)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Audit Status</p>
                  <p className="text-lg font-semibold text-blue-600">In Progress</p>
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={cancelAudit}
                    disabled={loading}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Cancel Audit
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => completeAudit(false)}
                    disabled={loading || currentAudit.items.length === 0}
                  >
                    <Square className="mr-2 h-4 w-4" />
                    Complete (No Adjustments)
                  </Button>
                  <Button
                    onClick={() => completeAudit(true)}
                    disabled={loading || currentAudit.items.length === 0}
                    className="bg-gradient-to-r from-green-600 to-green-700"
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Complete & Apply Adjustments
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

