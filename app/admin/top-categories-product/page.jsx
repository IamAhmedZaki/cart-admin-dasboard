'use client';

import { useState, useEffect } from 'react';
import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, MoreHorizontal } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import api from '@/lib/api';
import { toast } from 'sonner';
import LoadingSpinner from '@/components/LoadingSpinner/LoadingSpinner';
import SearchableSelect from '@/components/SearchableSelect';

const schema = z.object({
  category_id: z.string().min(1, 'Category is required').regex(/^\d+$/, 'Category ID must be a number'),
  isActive: z.boolean().optional(),
});

export default function TopCategoriesProduct() {
  const [topCategories, setTopCategories] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTopCategory, setSelectedTopCategory] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isToggleConfirmOpen, setIsToggleConfirmOpen] = useState(false);
  const [selectedDeleteId, setSelectedDeleteId] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
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
    order: 'desc',
  });

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      category_id: '',
      isActive: true,
    },
  });

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);

  const { watch, setValue } = form;
  const isActive = watch('isActive');

  useEffect(() => {
    if (selectedTopCategory) {
      form.reset({
        category_id: selectedTopCategory.category_id.toString(),
        isActive: selectedTopCategory.isActive,
      });
      setPreview(selectedTopCategory?.image_url || null);
    } else {
      form.reset({
        category_id: '',
        isActive: true,
      });
      setPreview(null);
    }
    setFile(null);
  }, [selectedTopCategory, form]);

  const onDrop = (acceptedFiles) => {
    const uploadedFile = acceptedFiles[0];
    if (uploadedFile) {
      setFile(uploadedFile);
      setPreview(URL.createObjectURL(uploadedFile));
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 
      'image/*': [
        '.jpg', 
        '.jpeg', 
        '.png', 
        '.gif', 
        '.webp', 
        '.bmp', 
        '.tiff', 
        '.tif', 
        '.svg', 
        '.ico', 
        '.heic', 
        '.heif', 
        '.avif'
      ] 
    },
    multiple: false,
    disabled: isActionLoading,
  });

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data);
    } catch (error) {
      toast.error('Failed to fetch categories');
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/top-categories', {
        params: {
          page: pagination.currentPage,
          limit: pagination.limit,
          search: filters.search,
          status: filters.status,
          sort: filters.sort,
          order: filters.order,
        },
      });
      setTopCategories(response.data.data);
      setPagination(response.data.pagination);
    } catch (error) {
      toast.error(error.response?.status === 401 ? 'Please log in to access this page' : 'Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchData();
  }, [pagination.currentPage, pagination.limit, filters]);

  // Prepare options for SearchableSelect
  const categoryOptions = categories.map(category => ({
    value: category.id.toString(),
    label: category.name
  }));

  const handleAdd = () => {
    setSelectedTopCategory(null);
    setIsModalOpen(true);
  };

  const handleEdit = (topCategory) => {
    setSelectedTopCategory(topCategory);
    setIsModalOpen(true);
  };

  const openDeleteConfirm = (id) => {
    setIsModalOpen(false);
    setSelectedDeleteId(id);
    setIsDeleteModalOpen(true);
  };

  const openToggleConfirm = (id, isActive) => {
    setIsModalOpen(false);
    setSelectedDeleteId(id);
    setConfirmAction(isActive ? 'deactivate' : 'activate');
    setIsToggleConfirmOpen(true);
  };

  const handleDelete = async () => {
    setIsActionLoading(true);
    try {
      await api.delete(`/top-categories/${selectedDeleteId}`);
      fetchData();
      toast.success('Top category deleted successfully');
    } catch (error) {
      toast.error(error.response?.status === 401 ? 'Please log in to perform this action' : 'Failed to delete top category');
    } finally {
      setIsActionLoading(false);
      setIsDeleteModalOpen(false);
      setSelectedDeleteId(null);
    }
  };

  const handleToggleActive = async () => {
    setIsActionLoading(true);
    try {
      await api.patch(`/top-categories/${selectedDeleteId}/toggle`);
      fetchData();
      toast.success(`Top category ${confirmAction === 'activate' ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      toast.error(error.response?.status === 401 ? 'Please log in to perform this action' : 'Failed to toggle top category status');
    } finally {
      setIsActionLoading(false);
      setIsToggleConfirmOpen(false);
      setSelectedDeleteId(null);
    }
  };

  const handleSubmitForm = async (data) => {
    setIsActionLoading(true);
    try {
      const formattedData = JSON.stringify({
        category_id: Number(data.category_id),
        isActive: data.isActive,
      });
      const formData = new FormData();
      formData.append('formattedData', formattedData);
      if (file) {
        formData.append('image', file);
      }

      if (selectedTopCategory) {
        await api.put(`/top-categories/${selectedTopCategory.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        await api.post('/top-categories', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      fetchData();
      setIsModalOpen(false);
      toast.success(selectedTopCategory ? 'Top category updated successfully' : 'Top category created successfully');
    } catch (error) {
      toast.error(error.response?.status === 401 ? 'Please log in to perform this action' : 'Failed to save top category');
    } finally {
      setIsActionLoading(false);
      setFile(null);
      setPreview(null);
      form.reset();
    }
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setFile(null);
    setPreview(null);
    form.reset();
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl sm:text-2xl font-bold">Top Categories</h2>
        <Button onClick={handleAdd} className="w-full sm:w-auto">
          Add Top Category
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:gap-4">
        <Input
          placeholder="Search by ID or category name"
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
          <div className="overflow-x-auto min-w-full">
            <Table className="min-w-max">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px] sm:w-[100px]">ID</TableHead>
                  <TableHead className="w-[80px] sm:w-[100px]">Image</TableHead>
                  <TableHead className="max-w-[150px] sm:max-w-none">Category</TableHead>
                  <TableHead className="w-[100px]">Status</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topCategories.length == 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <div className="flex flex-col items-center justify-center">
                        <AlertCircle className="h-10 w-10 sm:h-12 sm:w-12 text-gray-500 mb-4" />
                        <p className="text-base sm:text-lg text-gray-600">Data Not Found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  topCategories.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.id}</TableCell>
                      <TableCell>
                        {item.image_url ? (
                          <img src={item.image_url} alt="Banner" className="h-8 w-auto object-cover rounded sm:h-10" />
                        ) : (
                          <span>No Image</span>
                        )}
                      </TableCell>
                      <TableCell className="truncate max-w-[150px] sm:max-w-none">{item.category_name}</TableCell>
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
                            <Button variant="ghost" className="h-8 w-8 p-0" disabled={isActionLoading}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleEdit(item)}
                              disabled={isActionLoading}
                              className="text-xs sm:text-sm"
                            >
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => openDeleteConfirm(item.id)}
                              disabled={isActionLoading}
                              className="text-xs sm:text-sm"
                            >
                              Delete
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => openToggleConfirm(item.id, item.isActive)}
                              disabled={isActionLoading}
                              className="text-xs sm:text-sm"
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
          {!isLoading && topCategories.length > 0 && (
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-4">
              <div className="flex items-center space-x-2 text-sm">
                <p>
                  Showing {(pagination.currentPage - 1) * pagination.limit + 1} -{' '}
                  {Math.min(pagination.currentPage * pagination.limit, pagination.totalItems)} of{' '}
                  {pagination.totalItems} top categories
                </p>
                <Select
                  value={pagination.limit.toString()}
                  onValueChange={handleLimitChange}
                  disabled={isLoading || isActionLoading}
                >
                  <SelectTrigger className="w-[80px] sm:w-[100px]">
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
                  disabled={pagination.currentPage === 1 || isLoading || isActionLoading}
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                >
                  Previous
                </Button>
                <span className="text-sm">Page {pagination.currentPage} of {pagination.totalPages}</span>
                <Button
                  variant="outline"
                  disabled={pagination.currentPage === pagination.totalPages || isLoading || isActionLoading}
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Add/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={handleClose}>
        <DialogContent className="w-[90vw] max-w-md sm:max-w-lg p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">{selectedTopCategory ? 'Edit Top Category' : 'Add Top Category'}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmitForm)} className="space-y-4">
              {/* Category Field with SearchableSelect */}
              <FormField
                control={form.control}
                name="category_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm sm:text-base">Category</FormLabel>
                    <FormControl>
                      <SearchableSelect
                        options={categoryOptions}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Select a category"
                        disabled={isActionLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Image Dropzone */}
              <div className="space-y-2">
                <Label className="text-sm sm:text-base">
                  {selectedTopCategory ? 'Banner Image (Optional Update)' : 'Banner Image'}
                </Label>
                <div
                  {...getRootProps()}
                  className={`mt-1 border-2 border-dashed rounded-md p-4 text-center cursor-pointer ${
                    isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                  } ${isActionLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <input {...getInputProps()} />
                  {preview ? (
                    <img src={preview} alt="Preview" className="mx-auto h-24 sm:h-32 w-auto object-cover rounded" />
                  ) : (
                    <p className="text-sm sm:text-base">{isDragActive ? 'Drop the image here...' : 'Drag & drop an image, or click to select'}</p>
                  )}
                  <p className="text-xs sm:text-sm text-gray-500">Only one image allowed</p>
                </div>
              </div>

              {/* Active Switch - Only show for Add mode */}
              {!selectedTopCategory && (
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel className="text-sm sm:text-base">Active</FormLabel>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isActionLoading}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              )}

              <DialogFooter className="flex flex-col sm:flex-row gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isActionLoading}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isActionLoading || (!file && !selectedTopCategory?.image_url && !selectedTopCategory)}
                  className="w-full sm:w-auto"
                >
                  {isActionLoading ? 'Saving...' : 'Save'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={() => setIsDeleteModalOpen(false)}>
        <DialogContent className="w-[90vw] max-w-md sm:max-w-lg p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Confirm Delete</DialogTitle>
            <DialogDescription className="text-sm sm:text-base">
              Are you sure you want to delete this top category? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={isActionLoading}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isActionLoading}
              className="w-full sm:w-auto"
            >
              {isActionLoading ? 'Deleting...' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Toggle Active/Inactive Confirmation Modal */}
      <Dialog open={isToggleConfirmOpen} onOpenChange={() => setIsToggleConfirmOpen(false)}>
        <DialogContent className="w-[90vw] max-w-md sm:max-w-lg p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Confirm {confirmAction === 'activate' ? 'Activation' : 'Deactivation'}</DialogTitle>
            <DialogDescription className="text-sm sm:text-base">
              Are you sure you want to {confirmAction === 'activate' ? 'activate' : 'deactivate'} this top category?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setIsToggleConfirmOpen(false)}
              disabled={isActionLoading}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleToggleActive}
              disabled={isActionLoading}
              className="w-full sm:w-auto"
              variant="destructive"
            >
              {isActionLoading ? 'Confirming...' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}