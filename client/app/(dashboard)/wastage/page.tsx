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
          <h1 className="text-3xl font-bold text-gray-900">Wastage Management</h1>
          <p className="text-gray-600 mt-1">Track damaged and unsellable items</p>
        </div>
        <Link href="/wastage/create">
          <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
            <Plus className="mr-2 h-4 w-4" />
            Record Wastage
          </Button>
        </Link>
      </div>

      {/* Summary */}
      <Card className="border-0 shadow-md bg-red-50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Cost Impact</p>
              <p className="text-3xl font-bold text-red-600">
                {formatCurrency(totalCostImpact)}
              </p>
            </div>
            <AlertTriangle className="h-12 w-12 text-red-600" />
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
              <p className="mt-4 text-gray-600">Loading wastage records...</p>
            </div>
          ) : wastage.length === 0 ? (
            <div className="text-center py-12">
              <AlertTriangle className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">No wastage records</h3>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-semibold">Product</th>
                    <th className="text-right p-4 font-semibold">Quantity</th>
                    <th className="text-left p-4 font-semibold">Reason</th>
                    <th className="text-right p-4 font-semibold">Cost Impact</th>
                    <th className="text-left p-4 font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {wastage.map((w) => (
                    <tr key={w._id} className="border-b hover:bg-gray-50">
                      <td className="p-4 font-medium text-gray-900">{w.productName}</td>
                      <td className="p-4 text-right">{w.quantity}</td>
                      <td className="p-4">
                        <span className="capitalize bg-red-100 text-red-700 px-2 py-1 rounded text-sm">
                          {w.reason}
                        </span>
                      </td>
                      <td className="p-4 text-right font-semibold text-red-600">
                        {formatCurrency(w.costImpact)}
                      </td>
                      <td className="p-4 text-gray-600 text-sm">
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


