'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { returnsAPI } from '@/lib/api';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { Plus, RotateCcw } from 'lucide-react';
import Link from 'next/link';

export default function ReturnsPage() {
  const [returns, setReturns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReturns();
  }, []);

  const loadReturns = async () => {
    try {
      setLoading(true);
      const data = await returnsAPI.getAll();
      setReturns(data || []);
    } catch (error: any) {
      console.error('Error loading returns:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Returns</h1>
          <p className="text-gray-600 mt-1">Manage product returns</p>
        </div>
        <Link href="/returns/create">
          <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
            <Plus className="mr-2 h-4 w-4" />
            Create Return
          </Button>
        </Link>
      </div>

      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>All Returns ({returns.length})</CardTitle>
          <CardDescription>List of all processed returns</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Loading returns...</p>
            </div>
          ) : returns.length === 0 ? (
            <div className="text-center py-12">
              <RotateCcw className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">No returns found</h3>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-semibold">Bill No</th>
                    <th className="text-left p-4 font-semibold">Items</th>
                    <th className="text-right p-4 font-semibold">Refund Amount</th>
                    <th className="text-left p-4 font-semibold">Refund Mode</th>
                    <th className="text-left p-4 font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {returns.map((returnRecord) => (
                    <tr key={returnRecord._id} className="border-b hover:bg-gray-50">
                      <td className="p-4 font-mono">{returnRecord.billNumber}</td>
                      <td className="p-4">
                        <span className="text-gray-700">{returnRecord.items?.length || 0} items</span>
                      </td>
                      <td className="p-4 text-right font-semibold text-gray-900">
                        {formatCurrency(returnRecord.refundAmount)}
                      </td>
                      <td className="p-4">
                        <span className="capitalize bg-gray-100 px-2 py-1 rounded text-sm">
                          {returnRecord.refundMode}
                        </span>
                      </td>
                      <td className="p-4 text-gray-600 text-sm">
                        {formatDateTime(returnRecord.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


