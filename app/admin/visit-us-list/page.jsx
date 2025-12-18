'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, MoreHorizontal } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle } from '@/components/ui/alert-dialog';
import api from '@/lib/api';
import { toast } from 'sonner';
import LoadingSpinner from '@/components/LoadingSpinner/LoadingSpinner';

export default function VisitUs() {
  const [visitUsItems, setVisitUsItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showToggleConfirm, setShowToggleConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [toggleItem, setToggleItem] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    limit: 10,
  });
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    sort: 'id',
    order: 'asc',
  });
  const router = useRouter();

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/visit-us', {
        params: {
          page: pagination.currentPage,
          limit: pagination.limit,
          search: filters.search,
          status: filters.status,
          sort: filters.sort,
          order: filters.order,
        },
      });
      setVisitUsItems(response.data.data);
      setPagination(response.data.pagination);
    } catch (error) {
      toast.error(error.response?.status === 401 ? 'Please log in to access this page' : 'Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [pagination.currentPage, pagination.limit, filters]);

  const handleAdd = () => {
    router.push('/admin/visit-us');
  };

  const handleEdit = (item) => {
    router.push(`/admin/visit-us/edit/${item.id}`);
  };

  const handleDelete = (id) => {
    setDeleteId(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      await api.delete(`/visit-us/${deleteId}`);
      await fetchData();
      toast.success('Item deleted successfully');
    } catch (error) {
      toast.error(error.response?.status === 401 ? 'Please log in to perform this action' : 'Failed to delete item');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      setDeleteId(null);
    }
  };

  const handleToggleActive = (item) => {
    setToggleItem(item);
    setShowToggleConfirm(true);
  };

  const confirmToggleActive = async () => {
    if (!toggleItem) return;
    setIsToggling(true);
    try {
      await api.patch(`/visit-us/${toggleItem.id}/toggle`);
      await fetchData();
      toast.success(`Item ${toggleItem.isActive ? 'deactivated' : 'activated'} successfully`);
    } catch (error) {
      toast.error(error.response?.status === 401 ? 'Please log in to perform this action' : 'Failed to toggle item status');
    } finally {
      setIsToggling(false);
      setShowToggleConfirm(false);
      setToggleItem(null);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination((prev) => ({ ...prev, currentPage: newPage }));
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const handleLimitChange = (value) => {
    setPagination((prev) => ({ ...prev, limit: Number(value), currentPage: 1 }));
  };

  return (
    <div className="space-y-4 sm:space-y-6 p-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-xl sm:text-2xl font-bold">Visit Us</h2>
        <Button onClick={handleAdd} className="w-full sm:w-auto">
          Add Item
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-4">
        <Input
          placeholder="Search by ID, title, or address"
          value={filters.search}
          onChange={(e) => handleFilterChange('search', e.target.value)}
          className="w-full sm:max-w-sm"
        />
        <Select
          value={filters.status}
          onValueChange={(value) => handleFilterChange('status', value)}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={filters.sort}
          onValueChange={(value) => handleFilterChange('sort', value)}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="id">ID</SelectItem>
            <SelectItem value="title">Title</SelectItem>
            <SelectItem value="isActive">Status</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={filters.order}
          onValueChange={(value) => handleFilterChange('order', value)}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Sort order" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="asc">Ascending</SelectItem>
            <SelectItem value="desc">Descending</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs sm:text-sm">ID</TableHead>
                  <TableHead className="text-xs sm:text-sm">Title</TableHead>
                  <TableHead className="text-xs sm:text-sm">Addresses and Map Embeds</TableHead>
                  <TableHead className="text-xs sm:text-sm">Status</TableHead>
                  <TableHead className="text-xs sm:text-sm">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visitUsItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <div className="flex flex-col items-center justify-center">
                        <AlertCircle className="h-10 w-10 sm:h-12 sm:w-12 text-gray-500 mb-4" />
                        <p className="text-base sm:text-lg text-gray-600">Data Not Found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  visitUsItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="text-xs sm:text-sm">{item.id}</TableCell>
                      <TableCell className="text-xs sm:text-sm">{item.title}</TableCell>
                      <TableCell className="max-w-[200px] sm:max-w-xs">
                        {item.maps.map((map, index) => (
                          <div key={index} className="mb-2">
                            <div className="truncate text-xs sm:text-sm">
                              <strong>Address:</strong> {map.address}
                            </div>
                            <div className="truncate text-xs sm:text-sm">
                              <strong>Map Embed:</strong> {map.map_embed}
                            </div>
                          </div>
                        ))}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs sm:text-sm font-medium ${
                            item.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {item.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              disabled={isLoading || isDeleting || isToggling}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(item)} disabled={isLoading || isDeleting || isToggling}>
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(item.id)} disabled={isLoading || isDeleting || isToggling}>
                              Delete
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleToggleActive(item)}
                              disabled={isLoading || isDeleting || isToggling}
                            >
                              {item.isActive ? 'Deactivate' : 'Activate'}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {!isLoading && visitUsItems.length > 0 && (
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-4">
              <div className="flex items-center space-x-2 text-sm">
                <p>
                  Showing {(pagination.currentPage - 1) * pagination.limit + 1} -{' '}
                  {Math.min(pagination.currentPage * pagination.limit, pagination.totalItems)} of{' '}
                  {pagination.totalItems} items
                </p>
                <Select
                  value={pagination.limit.toString()}
                  onValueChange={handleLimitChange}
                  disabled={isLoading || isDeleting || isToggling}
                >
                  <SelectTrigger className="w-[100px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
                <p>per page</p>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  disabled={pagination.currentPage === 1 || isLoading || isDeleting || isToggling}
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                >
                  Previous
                </Button>
                <span className="text-sm">Page {pagination.currentPage} of {pagination.totalPages}</span>
                <Button
                  variant="outline"
                  disabled={pagination.currentPage === pagination.totalPages || isLoading || isDeleting || isToggling}
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="w-[90vw] max-w-md sm:max-w-lg p-4 sm:p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg sm:text-xl">Confirm Delete</AlertDialogTitle>
            <AlertDialogDescription className="text-sm sm:text-base">
              Are you sure you want to delete this item? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto" disabled={isDeleting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="w-full sm:w-auto bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={showToggleConfirm} onOpenChange={setShowToggleConfirm}>
        <AlertDialogContent className="w-[90vw] max-w-md sm:max-w-lg p-4 sm:p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg sm:text-xl">Confirm Status Change</AlertDialogTitle>
            <AlertDialogDescription className="text-sm sm:text-base">
              Are you sure you want to {toggleItem?.isActive ? 'deactivate' : 'activate'} this item?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto" disabled={isToggling}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmToggleActive}
              disabled={isToggling}
              className="w-full sm:w-auto bg-red-600 hover:bg-red-700"
            >
              {isToggling ? 'Confirming...' : 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}