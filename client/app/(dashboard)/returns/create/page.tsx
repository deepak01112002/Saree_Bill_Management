'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { returnsAPI, billingAPI } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { ArrowLeft, Search, Plus, Minus, Trash2, QrCode } from 'lucide-react';
import Link from 'next/link';
import { showToast } from '@/lib/toast';
import { BillQRScanner } from '@/components/returns/BillQRScanner';

interface ReturnItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  reason: string;
}

export default function CreateReturnPage() {
  const router = useRouter();
  const [billNumber, setBillNumber] = useState('');
  const [bill, setBill] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [returnItems, setReturnItems] = useState<ReturnItem[]>([]);
  const [refundMode, setRefundMode] = useState<'cash' | 'upi' | 'card' | 'adjustment'>('cash');
  const [error, setError] = useState('');
  const [qrScannerOpen, setQrScannerOpen] = useState(false);

  const searchBill = async (billNum?: string) => {
    const billNumToSearch = billNum || billNumber;
    if (!billNumToSearch) {
      setError('Please enter a bill number');
      return;
    }

    try {
      setSearching(true);
      setError('');
      const billData = await billingAPI.getByNumber(billNumToSearch);
      setBill(billData);
      setBillNumber(billNumToSearch);
      showToast.success('Bill loaded successfully');
    } catch (err: any) {
      setError('Bill not found. Please check the bill number.');
      setBill(null);
      showToast.error('Bill not found. Please check the bill number.');
    } finally {
      setSearching(false);
    }
  };

  const handleQRScanSuccess = async (billData: { billId?: string; billNumber?: string }) => {
    try {
      if (billData.billId) {
        // If we have bill ID, fetch by ID
        const billDataById = await billingAPI.getById(billData.billId);
        setBill(billDataById);
        setBillNumber(billDataById.billNumber);
        showToast.success('Bill loaded successfully');
      } else if (billData.billNumber) {
        // If we have bill number, search by number
        await searchBill(billData.billNumber);
      } else {
        showToast.error('Invalid bill QR code data');
      }
    } catch (err: any) {
      console.error('Error loading bill from QR:', err);
      showToast.error('Failed to load bill from QR code');
    }
  };

  const addReturnItem = (billItem: any, reason: string) => {
    const existing = returnItems.find((item) => item.productId === billItem.productId);
    
    if (existing) {
      setReturnItems(
        returnItems.map((item) =>
          item.productId === billItem.productId
            ? { ...item, quantity: item.quantity + 1, reason }
            : item
        )
      );
    } else {
      setReturnItems([
        ...returnItems,
        {
          productId: billItem.productId,
          productName: billItem.productName,
          quantity: 1,
          price: billItem.price,
          reason,
        },
      ]);
    }
  };

  const updateQuantity = (productId: string, change: number) => {
    setReturnItems(
      returnItems
        .map((item) => {
          if (item.productId === productId) {
            const billItem = bill.items.find((i: any) => i.productId === productId);
            const newQuantity = Math.max(1, Math.min(item.quantity + change, billItem.quantity));
            return { ...item, quantity: newQuantity };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const removeItem = (productId: string) => {
    setReturnItems(returnItems.filter((item) => item.productId !== productId));
  };

  const calculateRefund = () => {
    return returnItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const handleSubmit = async () => {
    if (!bill || returnItems.length === 0) {
      setError('Please select items to return');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const returnData = {
        billId: bill._id,
        billNumber: bill.billNumber,
        items: returnItems.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          price: item.price,
          reason: item.reason,
        })),
        refundMode,
      };

      await returnsAPI.create(returnData);
      showToast.success('Return processed successfully!');
      router.push('/returns');
    } catch (err: any) {
      setError(err.message || 'Failed to process return');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/returns">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create Return</h1>
          <p className="text-gray-600 mt-1">Process a product return</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Bill Search */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>Search Bill</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    placeholder="Enter bill number (e.g., BILL-20240101-001)"
                    value={billNumber}
                    onChange={(e) => setBillNumber(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && searchBill()}
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={() => setQrScannerOpen(true)}
                  className="flex items-center gap-2"
                >
                  <QrCode className="h-4 w-4" />
                  Scan QR
                </Button>
                <Button onClick={() => searchBill()} disabled={searching}>
                  <Search className="mr-2 h-4 w-4" />
                  Search
                </Button>
              </div>
              {error && (
                <p className="mt-2 text-sm text-red-600">{error}</p>
              )}
            </CardContent>
          </Card>

          {/* Bill Items */}
          {bill && (
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle>Bill Items</CardTitle>
                <CardDescription>Select items to return</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {bill.items.map((item: any) => {
                    const returnItem = returnItems.find((ri) => ri.productId === item.productId);
                    const maxQuantity = item.quantity - (returnItem?.quantity || 0);

                    return (
                      <div
                        key={item.productId}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex-1">
                          <p className="font-medium">{item.productName}</p>
                          <p className="text-sm text-gray-500">
                            Qty: {item.quantity} • {formatCurrency(item.price)} each
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            type="text"
                            placeholder="Reason"
                            value={returnItem?.reason || ''}
                            onChange={(e) => {
                              if (returnItem) {
                                setReturnItems(
                                  returnItems.map((ri) =>
                                    ri.productId === item.productId
                                      ? { ...ri, reason: e.target.value }
                                      : ri
                                  )
                                );
                              } else {
                                addReturnItem(item, e.target.value);
                              }
                            }}
                            className="w-32 h-8 text-sm"
                          />
                          {returnItem ? (
                            <div className="flex items-center gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateQuantity(item.productId, -1)}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-8 text-center text-sm">{returnItem.quantity}</span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateQuantity(item.productId, 1)}
                                disabled={returnItem.quantity >= item.quantity}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => addReturnItem(item, '')}
                              disabled={maxQuantity <= 0}
                            >
                              Add
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Return Items */}
          {returnItems.length > 0 && (
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle>Items to Return</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {returnItems.map((item) => (
                    <div
                      key={item.productId}
                      className="flex items-center justify-between p-3 bg-orange-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{item.productName}</p>
                        <p className="text-sm text-gray-500">
                          Qty: {item.quantity} • {formatCurrency(item.price)} each • Reason: {item.reason}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{formatCurrency(item.price * item.quantity)}</p>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeItem(item.productId)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Summary */}
        <div>
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>Return Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Refund Amount</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(calculateRefund())}
                </p>
              </div>

              <div className="space-y-2 pt-4 border-t">
                <Label>Refund Mode</Label>
                <div className="grid grid-cols-2 gap-2">
                  {(['cash', 'upi', 'card', 'adjustment'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setRefundMode(mode)}
                      className={`
                        capitalize px-4 py-3 rounded-md font-medium text-sm transition-all duration-200
                        border-2 flex items-center justify-center
                        ${
                          refundMode === mode
                            ? 'bg-blue-600 border-blue-600 text-white shadow-md ring-2 ring-blue-300 ring-offset-2'
                            : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-gray-700'
                        }
                      `}
                    >
                      <span className="font-semibold">{mode.toUpperCase()}</span>
                      {refundMode === mode && (
                        <span className="ml-2 text-xs">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={loading || returnItems.length === 0}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600"
                size="lg"
              >
                {loading ? 'Processing...' : 'Process Return'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* QR Scanner Dialog */}
      <BillQRScanner
        open={qrScannerOpen}
        onOpenChange={setQrScannerOpen}
        onScanSuccess={handleQRScanSuccess}
      />
    </div>
  );
}

