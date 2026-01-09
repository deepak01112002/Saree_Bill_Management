'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { billingAPI } from '@/lib/api';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { Search, Eye } from 'lucide-react';
import Link from 'next/link';
import { showToast } from '@/lib/toast';
import { getCurrentUser, isAdmin } from '@/lib/auth-utils';

export default function BillHistoryPage() {
  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
    loadBills();
  }, [page]);

  const loadBills = async () => {
    try {
      setLoading(true);
      const result = await billingAPI.getAll({ page, limit: 20 });
      setBills(result.bills || []);
      setTotal(result.total || 0);
      setPages(result.pages || 1);
    } catch (error: any) {
      console.error('Error loading bills:', error);
      showToast.error('Failed to load bills: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!search) {
      loadBills();
      return;
    }

    try {
      setLoading(true);
      const bill = await billingAPI.getByNumber(search);
      setBills([bill]);
      setTotal(1);
      setPages(1);
    } catch (error: any) {
      setBills([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const isUserAdmin = isAdmin();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bill History</h1>
          <p className="text-gray-600 mt-1">
            {isUserAdmin ? 'View all generated bills' : `View your bills (${user?.name || 'Staff'})`}
          </p>
        </div>
        <Link href="/billing">
          <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
            New Bill
          </Button>
        </Link>
      </div>

      {/* Search */}
      <Card className="border-0 shadow-md">
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by bill number..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10 h-11"
              />
            </div>
            <Button onClick={handleSearch}>Search</Button>
            {search && (
              <Button variant="outline" onClick={() => { setSearch(''); loadBills(); }}>
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bills List */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>All Bills ({total})</CardTitle>
          <CardDescription>List of all generated bills</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Loading bills...</p>
            </div>
          ) : bills.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No bills found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4 font-semibold text-gray-700">Bill No</th>
                      <th className="text-left p-4 font-semibold text-gray-700">Customer</th>
                      <th className="text-left p-4 font-semibold text-gray-700">Items</th>
                      <th className="text-right p-4 font-semibold text-gray-700">Total</th>
                      <th className="text-left p-4 font-semibold text-gray-700">Payment</th>
                      <th className="text-left p-4 font-semibold text-gray-700">Date</th>
                      <th className="text-center p-4 font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bills.map((bill) => (
                      <tr key={bill._id} className="border-b hover:bg-gray-50">
                        <td className="p-4">
                          <Link 
                            href={`/billing/view/${bill._id}`}
                            className="font-mono font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                          >
                            {bill.billNumber}
                          </Link>
                        </td>
                        <td className="p-4">
                          {bill.customerName || (
                            <span className="text-gray-400">Walk-in Customer</span>
                          )}
                          {bill.customerMobile && (
                            <p className="text-sm text-gray-500">{bill.customerMobile}</p>
                          )}
                        </td>
                        <td className="p-4">
                          <span className="text-gray-700">{bill.items?.length || 0} items</span>
                        </td>
                        <td className="p-4 text-right font-semibold text-gray-900">
                          {formatCurrency(bill.grandTotal)}
                        </td>
                        <td className="p-4">
                          <span className="capitalize bg-gray-100 px-2 py-1 rounded text-sm">
                            {bill.paymentMode}
                          </span>
                        </td>
                        <td className="p-4 text-gray-600 text-sm">
                          {formatDateTime(bill.createdAt)}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-center">
                            <Link href={`/billing/view/${bill._id}`}>
                              <Button variant="ghost" size="sm" title="View Bill">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
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
    </div>
  );
}

