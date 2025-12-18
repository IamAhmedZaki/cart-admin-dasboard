'use client';

import { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import DashboardCard from '@/components/DashboardCard/DashboardCard';
import { Users, Store, ShoppingCart, DollarSign } from 'lucide-react';
import api from '@/lib/api';
import { toast } from "sonner"

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function Analytics() {
  const [metrics, setMetrics] = useState({ users: 0, vendors: 0, orders: 0, revenue: 0 });

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await api.get('/analytics');
        setMetrics(response.data);
      } catch (error) {
        toast('Failed to fetch analytics');
      }
    };
    fetchMetrics();
  }, [toast]);

  const chartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Orders',
        data: [65, 59, 80, 81, 56, 55],
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
      {
        label: 'Revenue',
        data: [1200, 1900, 3000, 5000, 2000, 3000],
        backgroundColor: 'rgba(153, 102, 255, 0.2)',
        borderColor: 'rgba(153, 102, 255, 1)',
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Analytics</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DashboardCard title="Total Users" value={metrics.users} icon={Users} />
        <DashboardCard title="Total Vendors" value={metrics.vendors} icon={Store} />
        <DashboardCard title="Total Orders" value={metrics.orders} icon={ShoppingCart} />
        <DashboardCard title="Total Revenue" value={`$${metrics.revenue}`} icon={DollarSign} />
      </div>
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Sales Trends</h3>
        <Bar data={chartData} options={{ responsive: true }} />
      </div>
    </div>
  );
}