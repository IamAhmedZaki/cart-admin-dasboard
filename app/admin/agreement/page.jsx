'use client';
import { useState, useEffect, useMemo } from 'react';
import * as z from 'zod';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle } from '@/components/ui/alert-dialog';
import api from '@/lib/api';
import { toast } from 'sonner';
import LoadingSpinner from '@/components/LoadingSpinner/LoadingSpinner';

const schema = z.object({
  images: z.array(
    z.object({
      file: z.any().refine(
        (file) => file instanceof File,
        'Image is required'
      ).refine(
        (file) => [
          'image/jpeg',
          'image/jpg',
          'image/png',
          'image/gif',
          'image/webp',
          'image/bmp',
          'image/tiff',
          'image/svg+xml',
          'image/x-icon',
          'image/heic',
          'image/heif',
          'image/avif'
        ].includes(file.type),
        'Only image files are allowed (JPG, PNG, GIF, WEBP, BMP, TIFF, SVG, ICO, HEIC, HEIF, AVIF)'
      ),
    })
  ).min(1, 'At least one image is required'),
});

export default function Agreement() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [formData, setFormData] = useState(null);
  const [agreement, setAgreement] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteImageId, setDeleteImageId] = useState(null);

  const { register, handleSubmit, formState: { errors }, control, watch, reset, setValue } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      images: [{ file: null }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'images',
  });

  // Generate preview URLs and clean them up
  const previewUrls = useMemo(() => {
    const urls = {};
    fields.forEach((field, index) => {
      const file = watch(`images.${index}.file`);
      if (file instanceof File) {
        urls[index] = URL.createObjectURL(file);
      }
    });
    return urls;
  }, [watch, fields]);

  // Clean up object URLs on unmount or when files change
  useEffect(() => {
    return () => {
      Object.values(previewUrls).forEach((url) => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, [previewUrls]);

  const fetchAgreement = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/agreement');
      setAgreement(response.data);
    } catch (error) {
      if (error.response?.status !== 404) {
        toast.error('Failed to fetch agreement');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAgreement();
  }, []);

  const handleSubmitForm = async (data) => {
    setFormData(data);
    setShowConfirm(true);
  };

  const confirmSave = async () => {
    setIsSubmitting(true);
    const formDataToSend = new FormData();
    formData.images.forEach((image) => {
      if (image.file instanceof File) {
        formDataToSend.append('images', image.file);
      }
    });

    try {
      const response = await api.post('/agreement', formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setAgreement(response.data);
      toast.success('Images uploaded successfully');
      reset({ images: [{ file: null }] });
    } catch (error) {
      toast.error(error.response?.status === 401 ? 'Please log in to perform this action' : 'Failed to upload images');
    } finally {
      setIsSubmitting(false);
      setShowConfirm(false);
    }
  };

  const handleDeleteImage = (id) => {
    setDeleteImageId(id);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteImage = async () => {
    setIsDeleting(true);
    try {
      await api.delete(`/agreement-image/${deleteImageId}`);
      await fetchAgreement();
      toast.success('Image deleted successfully');
    } catch (error) {
      toast.error(error.response?.status === 401 ? 'Please log in to perform this action' : 'Failed to delete image');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      setDeleteImageId(null);
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-4 sm:space-y-6">
      <h2 className="text-xl sm:text-2xl font-bold">Agreement Images</h2>
      <div className="p-4 sm:p-6 bg-white rounded-lg shadow">
        <form onSubmit={handleSubmit(handleSubmitForm)} className="space-y-4 sm:space-y-6">
          <div className="space-y-2">
            <Label className="text-sm sm:text-base font-medium">Upload Images</Label>
            {fields.map((field, index) => (
              <div key={field.id} className="flex flex-col sm:flex-row sm:items-start sm:space-x-4 space-y-2 sm:space-y-0">
                <div className="flex-1">
                  <Input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/bmp,image/tiff,image/svg+xml,image/x-icon,image/heic,image/heif,image/avif"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setValue(`images.${index}.file`, file, { shouldValidate: true });
                      }
                    }}
                    disabled={isSubmitting || isDeleting}
                    className="w-full"
                  />
                  {/* {watch(`images.${index}.file`) instanceof File && (
                    <img
                      src={previewUrls[index]}
                      alt="Preview"
                      className="mt-2 w-24 h-24 sm:w-32 sm:h-32 object-cover rounded border border-gray-200"
                    />
                  )} */}
                  {errors.images?.[index]?.file && (
                    <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.images[index].file.message}</p>
                  )}
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  onClick={() => remove(index)}
                  disabled={isSubmitting || isDeleting || fields.length === 1}
                  className="w-full sm:w-[35px]"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {errors.images && !errors.images[0] && (
              <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.images.message}</p>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => append({ file: null })}
              disabled={isSubmitting || isDeleting}
              className="w-full sm:w-auto mt-2"
            >
              <Plus className="h-4 w-4 mr-2" /> Add Image
            </Button>
          </div>
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isSubmitting || isDeleting}
              className="w-full sm:w-auto"
            >
              {isSubmitting ? 'Uploading...' : 'Upload'}
            </Button>
          </div>
        </form>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="text-lg sm:text-xl font-semibold">Current Images</h3>
          {agreement && agreement.images.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {agreement.images.map((img, index) => (
                <div key={img.id} className="relative">
                  <div className="absolute top-2 left-2 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-red-500 text-white text-xs sm:text-sm flex items-center justify-center">
                    {index + 1}
                  </div>
                  <img
                    src={img.image_url}
                    alt="Agreement image"
                    className="w-full h-48 sm:h-56 object-cover rounded border border-gray-200"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={() => handleDeleteImage(img.id)}
                    disabled={isSubmitting || isDeleting}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8">
              <p className="text-gray-600 text-base sm:text-lg">No images uploaded yet.</p>
            </div>
          )}
        </div>
      )}

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent className="w-[90vw] max-w-md sm:max-w-lg p-4 sm:p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg sm:text-xl">Confirm Upload</AlertDialogTitle>
            <AlertDialogDescription className="text-sm sm:text-base">
              Are you sure you want to upload these images? This will replace any existing images.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto" disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmSave}
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              {isSubmitting ? 'Uploading...' : 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="w-[90vw] max-w-md sm:max-w-lg p-4 sm:p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg sm:text-xl">Confirm Delete</AlertDialogTitle>
            <AlertDialogDescription className="text-sm sm:text-base">
              Are you sure you want to delete this image?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto" disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteImage}
              disabled={isDeleting}
              className="w-full sm:w-auto bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}