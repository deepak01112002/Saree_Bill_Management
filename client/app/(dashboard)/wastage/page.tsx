'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { wastageAPI } from '@/lib/api';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { Plus, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function WastagePage() {
  const [wastage, setWastage] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWastage();
  }, []);

  const loadWastage = async () => {
    try {
      setLoading(true);
      const data = await wastageAPI.getAll();
      setWastage(data || []);
    } catch (error: any) {
      console.error('Error loading wastage:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalCostImpact = wastage.reduce((sum, w) => sum + (w.costImpact || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Wastage Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Track damaged and unsellable items</p>
        </div>
        <Link href="/wastage/create">
          <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
            <Plus className="mr-2 h-4 w-4" />
            Record Wastage
          </Button>
        </Link>
      </div>

      {/* Summary */}
      <Card className="border-0 shadow-md bg-red-50 dark:bg-red-900/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Cost Impact</p>
              <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                {formatCurrency(totalCostImpact)}
              </p>
            </div>
            <AlertTriangle className="h-12 w-12 text-red-600 dark:text-red-400" />
          </div>
        </CardContent>
      </Card>

      {/* Wastage List */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>All Wastage Records ({wastage.length})</CardTitle>
          <CardDescription>List of all wastage entries</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading wastage records...</p>
            </div>
          ) : wastage.length === 0 ? (
            <div className="text-center py-12">
              <AlertTriangle className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
              <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No wastage records</h3>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b dark:border-gray-700">
                    <th className="text-left p-4 font-semibold text-gray-700 dark:text-gray-300">Product</th>
                    <th className="text-right p-4 font-semibold text-gray-700 dark:text-gray-300">Quantity</th>
                    <th className="text-left p-4 font-semibold text-gray-700 dark:text-gray-300">Reason</th>
                    <th className="text-right p-4 font-semibold text-gray-700 dark:text-gray-300">Cost Impact</th>
                    <th className="text-left p-4 font-semibold text-gray-700 dark:text-gray-300">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {wastage.map((w) => (
                    <tr key={w._id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="p-4 font-medium text-gray-900 dark:text-white">{w.productName}</td>
                      <td className="p-4 text-right text-gray-900 dark:text-white">{w.quantity}</td>
                      <td className="p-4">
                        <span className="capitalize bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-2 py-1 rounded text-sm">
                          {w.reason}
                        </span>
                      </td>
                      <td className="p-4 text-right font-semibold text-red-600 dark:text-red-400">
                        {formatCurrency(w.costImpact)}
                      </td>
                      <td className="p-4 text-gray-600 dark:text-gray-400 text-sm">
                        {formatDateTime(w.createdAt)}
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


