'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { fittingsAPI } from '@/lib/api';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { Plus, Scissors, Edit, Trash2, CheckCircle2, XCircle } from 'lucide-react';
import Link from 'next/link';
import { showToast } from '@/lib/toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function FittingsPage() {
  const [fittings, setFittings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [fittingToDelete, setFittingToDelete] = useState<string | null>(null);

  useEffect(() => {
    loadFittings();
  }, []);

  const loadFittings = async () => {
    try {
      setLoading(true);
      const data = await fittingsAPI.getAll();
      setFittings(data || []);
    } catch (error: any) {
      console.error('Error loading fittings:', error);
      showToast.error('Failed to load fittings: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!fittingToDelete) return;

    try {
      await fittingsAPI.delete(fittingToDelete);
      showToast.success('Fitting service deleted successfully');
      loadFittings();
      setDeleteDialogOpen(false);
      setFittingToDelete(null);
    } catch (error: any) {
      showToast.error('Failed to delete fitting: ' + (error.message || 'Unknown error'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Fitting Services</h1>
          <p className="text-gray-600 mt-1">Manage fitting and stitching services</p>
        </div>
        <Link href="/fittings/add">
          <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
            <Plus className="mr-2 h-4 w-4" />
            Add Fitting Service
          </Button>
        </Link>
      </div>

      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>All Fitting Services ({fittings.length})</CardTitle>
          <CardDescription>List of all fitting and stitching services</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Loading fittings...</p>
            </div>
          ) : fittings.length === 0 ? (
            <div className="text-center py-12">
              <Scissors className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">No fitting services found</h3>
              <p className="mt-2 text-sm text-gray-500">Get started by creating a new fitting service</p>
              <Link href="/fittings/add">
                <Button className="mt-4">Add Fitting Service</Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-semibold">Service Name</th>
                    <th className="text-left p-4 font-semibold">Description</th>
                    <th className="text-left p-4 font-semibold">Unit</th>
                    <th className="text-right p-4 font-semibold">Rate</th>
                    <th className="text-center p-4 font-semibold">Status</th>
                    <th className="text-left p-4 font-semibold">Created</th>
                    <th className="text-center p-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {fittings.map((fitting) => (
                    <tr key={fitting._id} className="border-b hover:bg-gray-50">
                      <td className="p-4 font-semibold text-gray-900">{fitting.serviceName}</td>
                      <td className="p-4 text-gray-600">
                        {fitting.description || <span className="text-gray-400">No description</span>}
                      </td>
                      <td className="p-4 text-gray-700 capitalize">{fitting.unit}</td>
                      <td className="p-4 text-right font-semibold text-gray-900">
                        {formatCurrency(fitting.rate)} / {fitting.unit}
                      </td>
                      <td className="p-4 text-center">
                        {fitting.isActive ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-sm">
                            <CheckCircle2 className="h-3 w-3" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm">
                            <XCircle className="h-3 w-3" />
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-gray-600 text-sm">
                        {formatDateTime(fitting.createdAt)}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          <Link href={`/fittings/edit/${fitting._id}`}>
                            <Button variant="ghost" size="sm" title="Edit">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Delete"
                            onClick={() => {
                              setFittingToDelete(fitting._id);
                              setDeleteDialogOpen(true);
                            }}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Fitting Service</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this fitting service? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setFittingToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}


