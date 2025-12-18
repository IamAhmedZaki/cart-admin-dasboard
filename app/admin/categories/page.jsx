'use client';

import { useState, useEffect, useRef } from 'react';
import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, MoreHorizontal } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import api from '@/lib/api';
import { toast } from 'sonner';
import LoadingSpinner from '@/components/LoadingSpinner/LoadingSpinner';
import { categories } from '@/components/ProductCategoryIcons/ProductCategoryIcons';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
  icon: z.string().optional(),
  isActive: z.boolean().optional(),
  meta_title: z.string().max(60, 'Meta title must not exceed 60 characters').optional(),
  meta_description: z.string().max(160, 'Meta description must not exceed 160 characters').optional(),
  meta_keywords: z.string().optional(),
  slugName: z.string().optional(), // Allow any string, cleaned on submission
});

const productCategoryIcons = categories.map((category) => ({
  ...category,
  iconHtml: category.icon,
}));

const addFields = [
  { name: 'name', label: 'Name', type: 'text', placeholder: 'Enter category name' },
  { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Enter description' },
  {
    name: 'icon',
    label: 'Icon',
    type: 'select',
    placeholder: 'Select an icon',
    options: productCategoryIcons.map((cat) => ({
      id: cat.id,
      value: cat.iconHtml,
      label: cat.name,
      icon: cat.iconHtml,
    })),
  },
  { name: 'isActive', label: 'Active', type: 'switch' },
];

const editFields = [
  { name: 'name', label: 'Name', type: 'text', placeholder: 'Enter category name' },
  { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Enter description' },
  {
    name: 'icon',
    label: 'Icon',
    type: 'select',
    placeholder: 'Select an icon',
    options: [], // Populated dynamically in getEditFields
  },
  { name: 'isActive', label: 'Active', type: 'switch' },
];

const seoFields = [
  { name: 'slugName', label: 'URL Slug', type: 'text', placeholder: 'Enter URL slug (e.g., category-name)' },
  { name: 'meta_title', label: 'Meta Title', type: 'text', placeholder: 'Enter meta title (max 60 characters)' },
  { name: 'meta_description', label: 'Meta Description', type: 'textarea', placeholder: 'Enter meta description (max 160 characters)' },
  { name: 'meta_keywords', label: 'Meta Keywords', type: 'text', placeholder: 'Enter comma-separated keywords' },
];

const getEditFields = (selectedCategory) => [
  ...editFields.slice(0, 2),
  {
    name: 'icon',
    label: 'Icon',
    type: 'select',
    placeholder: 'Select an icon',
    options: [
      ...(selectedCategory && selectedCategory.icon && !productCategoryIcons.some(cat => cat.iconHtml === selectedCategory.icon)
        ? [{
            id: 'custom',
            value: selectedCategory.icon,
            label: 'Custom Icon',
            icon: selectedCategory.icon,
          }]
        : []),
      ...productCategoryIcons.map((cat) => ({
        id: cat.id,
        value: cat.iconHtml,
        label: cat.name,
        icon: cat.iconHtml,
      })),
    ],
  },
  ...editFields.slice(3),
];

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isToggleConfirmOpen, setIsToggleConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
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
  const isInitialMount = useRef(true);

  // Form State
  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm({
    resolver: zodResolver(schema),
    defaultValues: selectedCategory
      ? {
          name: selectedCategory.name,
          description: selectedCategory.description || '',
          icon: selectedCategory.icon || '',
          isActive: selectedCategory.isActive,
          meta_title: selectedCategory.meta_title || '',
          meta_description: selectedCategory.meta_description || '',
          meta_keywords: selectedCategory.meta_keywords || '',
          slugName: selectedCategory.slugName || '',
        }
      : {
          name: '',
          description: '',
          icon: '',
          isActive: true,
          meta_title: '',
          meta_description: '',
          meta_keywords: '',
          slugName: '',
        },
  });

  const isActive = watch('isActive');
  const meta_title = watch('meta_title');
  const meta_description = watch('meta_description');
  const slugName = watch('slugName');
  const name = watch('name');

  // Generate slug from name
  const generateSlug = () => {
    const generatedSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s]+/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
    setValue('slugName', generatedSlug);
  };

  useEffect(() => {
    if (isInitialMount.current) {
      fetchData();
      isInitialMount.current = false;
    }
  }, []);

  useEffect(() => {
    reset(selectedCategory
      ? {
          name: selectedCategory.name,
          description: selectedCategory.description || '',
          icon: selectedCategory.icon || '',
          isActive: selectedCategory.isActive,
          meta_title: selectedCategory.meta_title || '',
          meta_description: selectedCategory.meta_description || '',
          meta_keywords: selectedCategory.meta_keywords || '',
          slugName: selectedCategory.slugName || '',
        }
      : {
          name: '',
          description: '',
          icon: '',
          isActive: true,
          meta_title: '',
          meta_description: '',
          meta_keywords: '',
          slugName: '',
        });
  }, [selectedCategory, reset]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      console.log('Fetching categories with params:', { ...filters, page: pagination.currentPage, limit: pagination.limit });
      const response = await api.get('/all-categories', {
        params: {
          page: pagination.currentPage,
          limit: pagination.limit,
          search: filters.search,
          status: filters.status,
          sort: filters.sort,
          order: filters.order,
        },
      });
      const formattedCategories = response.data.data.map((category) => ({
        ...category,
        subcategories: category.subcategories.map((sub) => sub.name).join(', ') || 'None',
      }));
      setCategories(formattedCategories);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error(error.response?.status === 401 ? 'Please log in to access this page' : 'Failed to fetch categories');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [pagination.currentPage, pagination.limit, filters]);

  const handleAdd = () => {
    setSelectedCategory(null);
    setIsModalOpen(true);
  };

  const handleEdit = (category) => {
    setSelectedCategory(category);
    setIsModalOpen(true);
  };

  const openDeleteConfirm = (id) => {
    setIsModalOpen(false);
    setConfirmId(id);
    setConfirmAction('delete');
    setIsDeleteConfirmOpen(true);
  };

  const openToggleConfirm = (id, isActive) => {
    setIsModalOpen(false);
    setConfirmId(id);
    setConfirmAction(isActive ? 'deactivate' : 'activate');
    setIsToggleConfirmOpen(true);
  };


  const handleDelete = async () => {
    setIsActionLoading(true);
    try {
      await api.delete(`/categories/${confirmId}`);
      toast.success('Category deleted successfully');
      fetchData();
      setIsDeleteConfirmOpen(false);
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error(error.response?.status === 401 ? 'Please log in to perform this action' : 'Failed to delete category');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleToggleActive = async () => {
    setIsActionLoading(true);
    try {
      await api.patch(`/categories/${confirmId}/toggle`);
      toast.success(`Category ${confirmAction === 'activate' ? 'activated' : 'deactivated'} successfully`);
      fetchData();
      setIsToggleConfirmOpen(false);
    } catch (error) {
      console.error('Error toggling category status:', error);
      toast.error(error.response?.status === 401 ? 'Please log in to perform this action' : 'Failed to toggle category status');
    } finally {
      setIsActionLoading(false);
    }
  };


  const handleSubmitForm = async (data) => {
    setIsActionLoading(true);
    try {
      console.log('Submitting category data:', data);
      const cleanedData = {
        ...data,
        slugName: data.slugName
          ? data.slugName
              .toLowerCase()
              .replace(/\s+/g, '-')
              .replace(/-+/g, '-')
              .replace(/^-+|-+$/g, '') || null 
          : null,
      };
      if (selectedCategory) {
        await api.put(`/categories/${selectedCategory.id}`, cleanedData);
        toast.success('Category updated successfully');
      } else {
        await api.post('/categories', cleanedData);
        toast.success('Category created successfully');
      }
      fetchData();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving category:', error);
      toast.error(error.response?.status === 401 ? 'Please log in to perform this action' : error.response?.data?.error || 'Failed to save category');
    } finally {
      setIsActionLoading(false);
      reset();
    }
  };

  const handleClose = () => {
    setIsModalOpen(false);
    reset();
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
        <h2 className="text-xl sm:text-2xl font-bold">Categories</h2>
        <Button onClick={handleAdd} className="w-full sm:w-auto">
          Add Category
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:gap-4">
        <Input
          placeholder="Search by ID, name, or slug"
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
            <SelectItem value="name">Name</SelectItem>
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
                  <TableHead className="max-w-[150px] sm:max-w-none">Name</TableHead>
                  <TableHead className="max-w-[200px]">Description</TableHead>
                  <TableHead className="max-w-[200px]">Subcategories</TableHead>
                  <TableHead className="w-[80px] sm:w-[100px]">Icon</TableHead>
                  <TableHead className="w-[100px]">Status</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8">
                      <div className="flex flex-col items-center justify-center">
                        <AlertCircle className="h-10 w-10 sm:h-12 sm:w-12 text-gray-500 mb-4" />
                        <p className="text-base sm:text-lg text-gray-600">Data Not Found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  categories.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.id}</TableCell>
                      <TableCell className="truncate max-w-[150px] sm:max-w-none">{item.name}</TableCell>
                      <TableCell className="truncate max-w-[200px]">{item.description || 'None'}</TableCell>
                      <TableCell className="truncate max-w-[200px]">{item.subcategories}</TableCell>
                      <TableCell>
                        <div
                          className="w-6 h-6"
                          dangerouslySetInnerHTML={{ __html: item.icon }}
                        />
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs sm:text-sm ${
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
                            <DropdownMenuItem onClick={() => handleEdit(item)} disabled={isActionLoading} className="text-xs sm:text-sm">
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openDeleteConfirm(item.id)} disabled={isActionLoading} className="text-xs sm:text-sm">
                              Delete
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => openToggleConfirm(item.id, !item.isActive)}
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
          {!isLoading && categories.length > 0 && (
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-4">
              <div className="flex items-center space-x-2 text-sm">
                <p>
                  Showing {(pagination.currentPage - 1) * pagination.limit + 1} -{' '}
                  {Math.min(pagination.currentPage * pagination.limit, pagination.totalItems)} of{' '}
                  {pagination.totalItems} categories
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
        <DialogContent className="w-[90vw] max-w-md sm:max-w-lg p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">{selectedCategory ? 'Edit Category' : 'Add Category'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(handleSubmitForm)} className="space-y-4">
            {selectedCategory ? (
              <Tabs defaultValue="edit" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="edit">Basic Info</TabsTrigger>
                  <TabsTrigger value="seo">SEO</TabsTrigger>
                </TabsList>
                <TabsContent value="edit">
                  <div className="space-y-4">
                    {getEditFields(selectedCategory).map((field) => (
                      <div key={field.name} className="space-y-2">
                        <Label htmlFor={field.name} className="text-sm sm:text-base">{field.label}</Label>
                        {field.type === 'switch' ? (
                          <div className="mt-1">
                            <Switch
                              id={field.name}
                              checked={isActive}
                              onCheckedChange={(checked) => setValue('isActive', checked)}
                              disabled={isActionLoading}
                            />
                          </div>
                        ) : field.type === 'select' ? (
                          <Select
                            value={watch(field.name) || ''}
                            onValueChange={(value) => setValue(field.name, value)}
                            disabled={isActionLoading}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder={field.placeholder} />
                            </SelectTrigger>
                            <SelectContent>
                              {field.options.map((option) => (
                                <SelectItem key={option.id} value={option.value}>
                                  <div className="flex items-center space-x-2">
                                    <div dangerouslySetInnerHTML={{ __html: option.icon }} />
                                    <span>{option.label}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : field.type === 'textarea' ? (
                          <Textarea
                            id={field.name}
                            placeholder={field.placeholder}
                            {...register(field.name)}
                            className="mt-1"
                            disabled={isActionLoading}
                          />
                        ) : (
                          <Input
                            id={field.name}
                            type={field.type}
                            placeholder={field.placeholder}
                            {...register(field.name)}
                            className="mt-1"
                            disabled={isActionLoading}
                          />
                        )}
                        {errors[field.name] && (
                          <p className="text-red-500 text-sm mt-1">{errors[field.name].message}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </TabsContent>
                <TabsContent value="seo">
                  <div className="space-y-4">
                    {seoFields.map((field) => (
                      <div key={field.name} className="space-y-2">
                        <Label htmlFor={field.name} className="text-sm sm:text-base">{field.label}</Label>
                        {field.name === 'slugName' ? (
                          <div className="flex items-center space-x-2">
                            <Input
                              id={field.name}
                              type={field.type}
                              placeholder={field.placeholder}
                              {...register('slugName')} // Use register for free-form input
                              className="mt-1"
                              disabled={isActionLoading}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              onClick={generateSlug}
                              disabled={isActionLoading}
                            >
                              Generate
                            </Button>
                          </div>
                        ) : field.type === 'textarea' ? (
                          <Textarea
                            id={field.name}
                            placeholder={field.placeholder}
                            {...register(field.name)}
                            className="mt-1"
                            disabled={isActionLoading}
                            maxLength={field.name === 'meta_description' ? 160 : undefined}
                          />
                        ) : (
                          <Input
                            id={field.name}
                            type={field.type}
                            placeholder={field.placeholder}
                            {...register(field.name)}
                            className="mt-1"
                            disabled={isActionLoading}
                            maxLength={field.name === 'meta_title' ? 60 : undefined}
                          />
                        )}
                        {errors[field.name] && (
                          <p className="text-red-500 text-sm mt-1">{errors[field.name].message}</p>
                        )}
                        {field.name === 'meta_title' && (
                          <p className="text-xs text-gray-500 mt-1">{meta_title?.length || 0}/60 characters</p>
                        )}
                        {field.name === 'meta_description' && (
                          <p className="text-xs text-gray-500 mt-1">{meta_description?.length || 0}/160 characters</p>
                        )}
                        {field.name === 'slugName' && (
                          <p className="text-xs text-gray-500 mt-1">
                            Slug will be converted to lowercase letters, numbers, and hyphens on save (e.g., 'Mobile Phones!' becomes 'mobile-phones').
                          </p>
                        )}
                      </div>
                    ))}
                    <div className="p-2 border rounded-md bg-gray-50 mt-4">
                      <p className="text-blue-600 text-sm font-medium">{meta_title || 'Category Title'}</p>
                      <p className="text-green-600 text-xs">
                        qistmarket.pk/category/{
                          slugName
                            ? slugName
                                .toLowerCase()
                                .replace(/\s+/g, '-')
                                .replace(/-+/g, '-')
                                .replace(/^-+|-+$/g, '') || 'category-name'
                            : 'category-name'
                        }
                      </p>
                      <p className="text-gray-700 text-xs">{meta_description || 'No description provided.'}</p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="space-y-4">
                {addFields.map((field) => (
                  <div key={field.name} className="space-y-2">
                    <Label htmlFor={field.name} className="text-sm sm:text-base">{field.label}</Label>
                    {field.type === 'switch' ? (
                      <div className="mt-1">
                        <Switch
                          id={field.name}
                          checked={isActive}
                          onCheckedChange={(checked) => setValue('isActive', checked)}
                          disabled={isActionLoading}
                        />
                      </div>
                    ) : field.type === 'select' ? (
                      <Select
                        value={watch(field.name) || ''}
                        onValueChange={(value) => setValue(field.name, value)}
                        disabled={isActionLoading}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={field.placeholder} />
                        </SelectTrigger>
                        <SelectContent>
                          {field.options.map((option) => (
                            <SelectItem key={option.id} value={option.value}>
                              <div className="flex items-center space-x-2">
                                <div dangerouslySetInnerHTML={{ __html: option.icon }} />
                                <span>{option.label}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : field.type === 'textarea' ? (
                      <Textarea
                        id={field.name}
                        placeholder={field.placeholder}
                        {...register(field.name)}
                        className="mt-1"
                        disabled={isActionLoading}
                      />
                    ) : (
                      <Input
                        id={field.name}
                        type={field.type}
                        placeholder={field.placeholder}
                        {...register(field.name)}
                        className="mt-1"
                        disabled={isActionLoading}
                      />
                    )}
                    {errors[field.name] && (
                      <p className="text-red-500 text-sm mt-1">{errors[field.name].message}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              <Button type="button" variant="outline" onClick={handleClose} disabled={isActionLoading} className="w-full sm:w-auto">
                Cancel
              </Button>
              <Button type="submit" disabled={isActionLoading} className="w-full sm:w-auto">
                {isActionLoading ? 'Saving...' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent className="w-[90vw] max-w-md sm:max-w-lg p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Confirm Delete</DialogTitle>
            <DialogDescription className="text-sm sm:text-base">
              Are you sure you want to delete this category? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setIsDeleteConfirmOpen(false)}
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
      <Dialog open={isToggleConfirmOpen} onOpenChange={setIsToggleConfirmOpen}>
        <DialogContent className="w-[90vw] max-w-md sm:max-w-lg p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Confirm {confirmAction === 'activate' ? 'Activation' : 'Deactivation'}</DialogTitle>
            <DialogDescription className="text-sm sm:text-base">
              Are you sure you want to {confirmAction === 'activate' ? 'activate' : 'deactivate'} this category?
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