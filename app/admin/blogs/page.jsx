'use client';

import { useState, useEffect } from 'react';
import * as z from 'zod';
import DataTable from '@/components/DataTable/DataTable';
import FormModal from '@/components/FormModal/FormModal';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { toast } from "sonner"

const schema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters'),
  content: z.string().min(10, 'Content must be at least 10 characters'),
});

const columns = [
  { key: 'id', label: 'ID' },
  { key: 'title', label: 'Title' },
  { key: 'author_name', label: 'Author' },
  { key: 'created_at', label: 'Created At' },
];

export default function Blogs() {
  const [blogs, setBlogs] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBlog, setSelectedBlog] = useState(null);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const response = await api.get('/blogs');
        setBlogs(response.data);
      } catch (error) {
        toast('Failed to fetch blogs');
      }
    };
    fetchBlogs();
  }, [toast]);

  const handleAdd = () => {
    setSelectedBlog(null);
    setIsModalOpen(true);
  };

  const handleEdit = (blog) => {
    setSelectedBlog(blog);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/blogs/${id}`);
      setBlogs(blogs.filter((blog) => blog.id !== id));
      toast('Blog deleted');
    } catch (error) {
      toast('Failed to delete blog');
    }
  };

  const handleSubmit = async (data) => {
    try {
      if (selectedBlog) {
        await api.put(`/blogs/${selectedBlog.id}`, data);
        setBlogs(blogs.map((blog) => (blog.id === selectedBlog.id ? { ...blog, ...data } : blog)));
      } else {
        const response = await api.post('/blogs', data);
        setBlogs([...blogs, response.data]);
      }
      setIsModalOpen(false);
      toast(selectedBlog ? 'Blog updated' : 'Blog created');
    } catch (error) {
      toast('Failed to save blog');
    }
  };

  const fields = [
    { name: 'title', label: 'Title', type: 'text', placeholder: 'Enter blog title' },
    { name: 'content', label: 'Content', type: 'text', placeholder: 'Enter blog content' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Blogs</h2>
        <Button onClick={handleAdd}>Add Blog</Button>
      </div>
      <DataTable columns={columns} data={blogs} onEdit={handleEdit} onDelete={handleDelete} />
      {isModalOpen && (
        <FormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={selectedBlog ? 'Edit Blog' : 'Add Blog'}
          schema={schema}
          defaultValues={selectedBlog || { title: '', content: '' }}
          onSubmit={handleSubmit}
          fields={fields}
        />
      )}
    </div>
  );
}