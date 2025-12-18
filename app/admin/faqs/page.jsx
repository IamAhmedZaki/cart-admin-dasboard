'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import api from '@/lib/api';
import LoadingSpinner from '@/components/LoadingSpinner/LoadingSpinner';
import { AlertCircle } from 'lucide-react';

export default function AdminFaqs() {
  const [faqs, setFaqs] = useState([]);
  const [editingFaq, setEditingFaq] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [faqToDelete, setFaqToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    status: 'active',
  });

  const fetchFaqs = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/qas');
      setFaqs(res.data);
    } catch (error) {
      toast.error('Failed to fetch FAQs');
      console.error('Error fetching FAQs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFaqs();
  }, []);

  useEffect(() => {
    if (editingFaq) {
      setFormData({
        question: editingFaq.question,
        answer: editingFaq.answer,
        status: editingFaq.status,
      });
    } else {
      setFormData({ question: '', answer: '', status: 'active' });
    }
  }, [editingFaq]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleStatusChange = (value) => {
    setFormData((prev) => ({ ...prev, status: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsActionLoading(true);
    try {
      if (editingFaq) {
        await api.put(`/qas/${editingFaq.id}`, formData);
        toast.success('FAQ updated successfully');
      } else {
        await api.post('/qas', formData);
        toast.success('FAQ created successfully');
      }
      fetchFaqs();
      setEditingFaq(null);
      setFormData({ question: '', answer: '', status: 'active' });
    } catch (error) {
      toast.error(editingFaq ? 'Failed to update FAQ' : 'Failed to create FAQ');
      console.error('Error:', error);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await api.delete(`/qas/${faqToDelete}`);
      toast.success('FAQ deleted successfully');
      fetchFaqs();
      setDeleteDialogOpen(false);
    } catch (error) {
      toast.error('Failed to delete FAQ');
      console.error('Error deleting FAQ:', error);
    } finally {
      setIsDeleting(false);
      setFaqToDelete(null);
    }
  };

  const openDeleteDialog = (id) => {
    setEditingFaq(null); // Close the edit form
    setFormData({ question: '', answer: '', status: 'active' }); // Reset form
    setFaqToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleCancelEdit = () => {
    setEditingFaq(null);
    setFormData({ question: '', answer: '', status: 'active' });
  };

  return (
    <div className="container mx-auto p-4 space-y-4 sm:space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold">Manage FAQs</h1>
      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-4 sm:p-6 rounded-lg shadow">
        <div>
          <Label htmlFor="question" className="text-sm sm:text-base">Question</Label>
          <Input
            id="question"
            name="question"
            value={formData.question}
            onChange={handleChange}
            required
            disabled={isActionLoading}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="answer" className="text-sm sm:text-base">Answer</Label>
          <Textarea
            id="answer"
            name="answer"
            value={formData.answer}
            onChange={handleChange}
            required
            disabled={isActionLoading}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="status" className="text-sm sm:text-base">Status</Label>
          <Select value={formData.status} onValueChange={handleStatusChange} disabled={isActionLoading}>
            <SelectTrigger className="w-full sm:w-[180px] mt-1">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col sm:flex-row sm:space-x-2 space-y-2 sm:space-y-0">
          <Button 
            type="submit" 
            disabled={isActionLoading || !formData.question || !formData.answer}
            className="w-full sm:w-auto"
          >
            {isActionLoading ? 'Saving...' : (editingFaq ? 'Update FAQ' : 'Create FAQ')}
          </Button>
          {editingFaq && (
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleCancelEdit} 
              disabled={isActionLoading}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
          )}
        </div>
      </form>
      <div className="mt-6">
        {isLoading ? (
          <div className="flex justify-center items-center">
            <LoadingSpinner size="lg" />
          </div>
        ) : faqs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8">
            <AlertCircle className="h-10 w-10 sm:h-12 sm:w-12 text-gray-500 mb-4" />
            <p className="text-base sm:text-lg text-gray-600">No FAQs Found</p>
          </div>
        ) : (
          <>
            <div className="mb-2">
              <strong className="text-base sm:text-lg">FAQs</strong>
            </div>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={faq.id} value={`qa-${faq.id}`} className="border-b">
                  <AccordionTrigger className="text-sm sm:text-base py-2 sm:py-3">
                    {index + 1}. {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="p-4">
                    <p className="text-sm sm:text-base">{faq.answer}</p>
                    <p className="text-sm sm:text-base mt-2">
                      Status: <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs sm:text-sm font-medium ${faq.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {faq.status.charAt(0).toUpperCase() + faq.status.slice(1)}
                      </span>
                    </p>
                    <div className="mt-3 flex flex-col sm:flex-row sm:space-x-2 space-y-2 sm:space-y-0">
                      <Button 
                        onClick={() => setEditingFaq(faq)} 
                        disabled={isActionLoading || isDeleting}
                        className="w-full sm:w-auto"
                      >
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => openDeleteDialog(faq.id)}
                        disabled={isActionLoading || isDeleting}
                        className="w-full sm:w-auto"
                      >
                        Delete
                      </Button>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </>
        )}
      </div>
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="w-[90vw] max-w-md sm:max-w-lg p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Confirm Deletion</DialogTitle>
            <DialogDescription className="text-sm sm:text-base">
              Are you sure you want to delete this FAQ? This action cannot be undone.
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