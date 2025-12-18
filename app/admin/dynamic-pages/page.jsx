'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import QuillEditorForPage from '@/components/QuillEditorForPage';
import api from '@/lib/api';
import { toast } from 'sonner';
import LoadingSpinner from '@/components/LoadingSpinner/LoadingSpinner';
import { AlertCircle, Trash2, Plus } from 'lucide-react';

export default function AdminPages() {
  const [pages, setPages] = useState([]);
  const [organization, setOrganization] = useState(null);
  const [selectedPage, setSelectedPage] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [slug, setSlug] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [metaKeywords, setMetaKeywords] = useState('');
  const [category, setCategory] = useState('OTHER');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [pagesRes, orgRes] = await Promise.all([
          api.get('/pages'),
          api.get('/organization-settings'),
        ]);
        setPages(pagesRes.data);
        setOrganization(orgRes.data);
      } catch (error) {
        toast.error('Failed to fetch data');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleCreate = () => {
    setSelectedPage(null);
    setTitle('');
    setContent('');
    setSlug('');
    setIsActive(true);
    setMetaTitle('');
    setMetaDescription('');
    setMetaKeywords('');
    setCategory('OTHER');
    setCreateDialogOpen(true);
  };

  const handleEdit = (page) => {
    setSelectedPage(page);
    setTitle(page.title);
    setContent(page.content);
    setSlug(page.slug);
    setIsActive(page.isActive);
    setMetaTitle(page.metaTitle || '');
    setMetaDescription(page.metaDescription || '');
    setMetaKeywords(page.metaKeywords || '');
    setCategory(page.category || 'OTHER');
    setCreateDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const data = {
        title,
        content,
        slug,
        isActive,
        metaTitle: selectedPage ? metaTitle : undefined,
        metaDescription: selectedPage ? metaDescription : undefined,
        metaKeywords: selectedPage ? metaKeywords : undefined,
        category,
        organizationId: organization ? Number(organization.id) : undefined,
      };

      if (selectedPage) {
        await api.put(`/pages/${selectedPage.id}`, data);
      } else {
        await api.post('/pages', data);
      }

      const res = await api.get('/pages');
      setPages(res.data);
      toast.success(selectedPage ? 'Page updated successfully' : 'Page created successfully');
      setCreateDialogOpen(false);
    } catch (error) {
      toast.error('Failed to save page');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await api.delete(`/pages/${selectedPage.id}`);
      setPages(pages.filter((p) => p.id !== selectedPage.id));
      toast.success('Page deleted successfully');
      setDeleteDialogOpen(false);
      setCreateDialogOpen(false);
      setSelectedPage(null);
    } catch (error) {
      toast.error('Failed to delete page');
    } finally {
      setIsDeleting(false);
    }
  };

  const generateGooglePreview = () => {
    const titlePreview = metaTitle || title || 'Page Title';
    const descriptionPreview = metaDescription || `Description for ${title || 'page'}`;
    const urlPreview = `https://qistmarket.pk/${slug || 'page'}`;
    return (
      <div className="border border-gray-300 p-3 rounded-md bg-gray-50 text-sm">
        <p className="text-blue-600 font-medium truncate">{titlePreview}</p>
        <p className="text-green-700 text-xs truncate">{urlPreview}</p>
        <p className="text-gray-600 text-xs line-clamp-2">{descriptionPreview}</p>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold">Manage Pages</h1>
        <Button onClick={handleCreate} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Create New Page
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="space-y-6">
          {pages.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
              {pages.map((page) => (
                <div
                  key={page.id}
                  className="p-4 bg-white rounded-lg shadow-md border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                >
                  <div className="flex-1 space-y-1">
                    <h2 className="text-lg font-semibold truncate">{page.title}</h2>
                    <p className="text-xs text-gray-600">Slug: {page.slug}</p>
                    <p className="text-xs text-gray-600">Category: {page.category}</p>
                    <p className="text-xs text-gray-600">
                      Organization: {page.organization?.name || 'None'}
                    </p>
                    <p className="text-xs">
                      Status:{' '}
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          page.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {page.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </p>
                    <p className="text-xs text-gray-600">
                      Last Updated: {new Date(page.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Button size="sm" onClick={() => handleEdit(page)} className="w-full sm:w-auto">
                    Edit
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-12 w-12 text-gray-400 mb-3" />
              <p className="text-lg text-gray-600">No Pages Found</p>
            </div>
          )}
        </div>
      )}

      {/* ==================== CREATE / EDIT DIALOG ==================== */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="w-full max-w-full sm:max-w-2xl lg:max-w-4xl p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl sm:text-2xl">
              {selectedPage ? 'Edit Page' : 'Create Page'}
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base">
              {selectedPage ? 'Update the page details.' : 'Fill in the details to create a new page.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="mt-4 space-y-6">
            <Tabs defaultValue="content" className="w-full">
              <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2">
                <TabsTrigger value="content">Content</TabsTrigger>
                {selectedPage && <TabsTrigger value="seo">SEO</TabsTrigger>}
              </TabsList>

              {/* CONTENT TAB */}
              <TabsContent value="content" className="space-y-4">
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="title" className="text-sm font-medium">Page Title</Label>
                    <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required className="mt-1" disabled={isSubmitting} />
                  </div>
                  <div>
                    <Label htmlFor="slug" className="text-sm font-medium">Slug</Label>
                    <Input
                      id="slug"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                      required
                      className="mt-1"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <Label htmlFor="category" className="text-sm font-medium">Category</Label>
                    <Select value={category} onValueChange={setCategory} disabled={isSubmitting}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ABOUT">About</SelectItem>
                        <SelectItem value="INFORMATION">Information</SelectItem>
                        <SelectItem value="QUICK_LINKS">Quick Links</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* QUILL EDITOR - FIXED HEIGHT + SCROLLABLE */}
                  <div>
                    <Label className="text-sm font-medium">Page Content</Label>
                    <div className="mt-1 border rounded-md h-64 sm:h-80 overflow-hidden">
                      <QuillEditorForPage
                        value={content}
                        onChange={setContent}
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* SEO TAB */}
              {selectedPage && (
                <TabsContent value="seo" className="space-y-4">
                  <div className="grid gap-4">
                    <div>
                      <Label htmlFor="metaTitle" className="text-sm font-medium">Meta Title</Label>
                      <Input id="metaTitle" value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} className="mt-1" disabled={isSubmitting} />
                    </div>
                    <div>
                      <Label htmlFor="metaDescription" className="text-sm font-medium">Meta Description</Label>
                      <Input id="metaDescription" value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} className="mt-1" disabled={isSubmitting} />
                    </div>
                    <div>
                      <Label htmlFor="metaKeywords" className="text-sm font-medium">Meta Keywords</Label>
                      <Input id="metaKeywords" value={metaKeywords} onChange={(e) => setMetaKeywords(e.target.value)} className="mt-1" disabled={isSubmitting} />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Google Preview</Label>
                      <div className="mt-2">{generateGooglePreview()}</div>
                    </div>
                  </div>
                </TabsContent>
              )}
            </Tabs>

            {/* ==================== FIXED ACTION FOOTER (Always Below) ==================== */}
            <div className="mt-6 pt-4 border-t space-y-4">
              {/* Toggle */}
              <div className="flex items-center space-x-3">
                <Switch
                  id="isActive"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                  disabled={isSubmitting || isDeleting}
                />
                <Label htmlFor="isActive" className="text-sm font-medium cursor-pointer">
                  Set as Active
                </Label>
              </div>

              {/* Buttons */}
              <div className="flex flex-col-reverse sm:flex-row gap-3">
                {selectedPage && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => setDeleteDialogOpen(true)}
                    disabled={isSubmitting || isDeleting}
                    className="w-full sm:w-auto"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                )}
                <Button
                  type="submit"
                  disabled={isSubmitting || !title || !content || !slug || !organization}
                  className="w-full sm:w-auto"
                >
                  {isSubmitting ? 'Saving...' : selectedPage ? 'Update Page' : 'Create Page'}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="w-[90vw] max-w-md sm:max-w-lg p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Confirm Deletion</DialogTitle>
            <DialogDescription className="text-sm sm:text-base">
              Are you sure you want to delete the page "{selectedPage?.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
              className="w-full sm:w-auto"
            >
              {isDeleting ? 'Deleting...' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}