// app/admin/pixels/page.jsx
'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import api from '@/lib/api';
import { toast } from 'sonner';
import LoadingSpinner from '@/components/LoadingSpinner/LoadingSpinner';
import { AlertCircle, Trash2, Plus } from 'lucide-react';

export default function AdminPixels() {
  const [pixels, setPixels] = useState([]);
  const [selected, setSelected] = useState(null);
  const [platform, setPlatform] = useState('GOOGLE');
  const [pixelId, setPixelId] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Fetch pixels
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get('/pixels');
        setPixels(res.data);
      } catch (e) {
        toast.error('Failed to load pixels');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Open Create Dialog
  const openCreate = () => {
    setSelected(null);
    setPlatform('GOOGLE');
    setPixelId('');
    setIsActive(true);
    setDialogOpen(true);
  };

  // Open Edit Dialog
  const openEdit = (p) => {
    setSelected(p);
    setPlatform(p.platform);
    setPixelId(p.pixelId);
    setIsActive(p.isActive);
    setDialogOpen(true);
  };

  // Submit (Create/Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/pixels', { platform, pixelId, isActive });
      const res = await api.get('/pixels');
      setPixels(res.data);
      toast.success(selected ? 'Pixel updated' : 'Pixel created');
      setDialogOpen(false);
    } catch (e) {
      toast.error('Failed to save pixel');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete
  const handleDelete = async () => {
    if (!selected) return;
    try {
      await api.delete(`/pixels/${selected.id}`);
      setPixels(pixels.filter(x => x.id !== selected.id));
      toast.success('Pixel deleted');
      setDeleteOpen(false);
      setDialogOpen(false);
    } catch (e) {
      toast.error('Failed to delete');
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Google & FB Pixel Configurations</h1>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add Pixel
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center"><LoadingSpinner size="lg" /></div>
      ) : (
        <div className="grid gap-4">
          {pixels.length === 0 ? (
            <div className="flex flex-col items-center py-8">
              <AlertCircle className="h-12 w-12 text-gray-500 mb-4" />
              <p className="text-lg text-gray-600">No Google & FB Pixel Configured</p>
            </div>
          ) : (
            pixels.map(p => (
              <div key={p.id} className="p-4 bg-white rounded-lg shadow flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-semibold">
                    {p.platform === 'GOOGLE' ? 'Google ID' : 'Facebook Pixel ID'}
                  </h2>
                  <p className="text-sm text-gray-600">ID: {p.pixelId}</p>
                  <p className="text-sm">
                    Status:{' '}
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${p.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {p.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </p>
                </div>
                <Button onClick={() => openEdit(p)}>Edit</Button>
              </div>
            ))
          )}
        </div>
      )}

      {/* CREATE / EDIT DIALOG */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{selected ? 'Edit Google & FB Pixel ID' : 'Add Google & FB Pixel ID'}</DialogTitle>
            <DialogDescription>
              {selected ? 'Update the Google & FB Pixel ID and activation state.' : 'Enter the Google & FB Pixel ID for the selected platform.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="mb-2">Platform</Label>
              <Select value={platform} onValueChange={setPlatform} disabled={!!selected}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GOOGLE">Google</SelectItem>
                  <SelectItem value="FACEBOOK">Facebook</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-2">Google & FB Pixel ID</Label>
              <Input
                value={pixelId}
                onChange={(e) => setPixelId(e.target.value)}
                placeholder={platform === 'GOOGLE' ? 'G-XXXXXXXXXX or AW-XXXXXXXXX' : '123456789012345'}
                required
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch id="active" checked={isActive} onCheckedChange={setIsActive} />
              <Label htmlFor="active">Active</Label>
            </div>

            <DialogFooter className="gap-2">
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Saving…' : selected ? 'Update' : 'Create'}
              </Button>
              {selected && (
                <Button variant="destructive" type="button" onClick={() => setDeleteOpen(true)} disabled={submitting}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              )}
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRM */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Delete the {selected?.platform} pixel (ID: {selected?.pixelId})? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}