'use client';

import { useState, useEffect } from 'react';
import { 
  Users, ShoppingCart, DollarSign, Package, CheckCircle, XCircle, Truck, Clock, 
  Filter, X, RefreshCw, BarChart3 
} from 'lucide-react';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import DashboardCard from '@/components/DashboardCard/DashboardCard';
import api from '@/lib/api';
import { toast } from 'sonner';
import LoadingSpinner from '@/components/LoadingSpinner/LoadingSpinner';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

export default function AdvancedDashboard() {
  const [metrics, setMetrics] = useState({});
  const [orderTrends, setOrderTrends] = useState({ labels: [], datasets: [] });
  const [revenueTrends, setRevenueTrends] = useState({ labels: [], datasets: [] });
  const [analyticsData, setAnalyticsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterOptions, setFilterOptions] = useState({
    cities: [], areas: [], productNames: [], categories: [], subcategories: []
  });
  const [filters, setFilters] = useState({
    period: 'month', fromDate: '', toDate: '', city: '', area: '',
    category: '', subCategory: '', item: '', dimension: 'city'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [dimensionLoading, setDimensionLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Initialize state with proper structure
  useEffect(() => {
    setOrderTrends({ labels: [], datasets: [] });
    setRevenueTrends({ labels: [], datasets: [] });
    setAnalyticsData([]);
    fetchFilterOptions();
    fetchDashboardData();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDashboardData();
    }, 100);
    return () => clearTimeout(timer);
  }, [filters]);

  const fetchFilterOptions = async () => {
    try {
      const response = await api.get('/filter-options');
      setFilterOptions(response.data);
    } catch (error) {
      console.error('Error fetching filter options:', error);
      toast.error('Failed to fetch filter options');
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      // Always include period and custom dates
      params.append('period', filters.period);
      if (filters.fromDate && filters.toDate) {
        params.append('from_date', filters.fromDate);
        params.append('to_date', filters.toDate);
      }
      
      // Add other filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== '' && !['period', 'fromDate', 'toDate'].includes(key)) {
          const backendKey = key === 'subCategory' ? 'sub_category' : key;
          params.append(backendKey, value);
        }
      });

      const [metricsRes, trendsRes] = await Promise.all([
        api.get(`/dashboard-metrics?${params}`),
        api.get(`/order-trends?${params}`)
      ]);

      setMetrics(metricsRes.data || {});
      
      // Safely set trends data
      setOrderTrends(trendsRes.data?.orderTrends || { labels: [], datasets: [] });
      setRevenueTrends(trendsRes.data?.revenueTrends || { labels: [], datasets: [] });
      
      await fetchAnalyticsData();
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('No data found for the selected filters or an error occurred');
      
      // Reset trends data on error
      setOrderTrends({ labels: [], datasets: [] });
      setRevenueTrends({ labels: [], datasets: [] });
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalyticsData = async () => {
    try {
      setDimensionLoading(true);
      const params = new URLSearchParams();
      params.append('dimension', filters.dimension);
      params.append('period', filters.period);
      
      if (filters.fromDate && filters.toDate) {
        params.append('from_date', filters.fromDate);
        params.append('to_date', filters.toDate);
      }
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== '' && !['dimension', 'period', 'fromDate', 'toDate'].includes(key)) {
          const backendKey = key === 'subCategory' ? 'sub_category' : key;
          params.append(backendKey, value);
        }
      });

      if (searchTerm) {
        params.append('item', searchTerm);
      }

      const analyticsRes = await api.get(`/analytics-by-dimension?${params}`);
      setAnalyticsData(analyticsRes.data?.data || []);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      toast.error('No data found for the selected dimension or an error occurred');
      setAnalyticsData([]);
    } finally {
      setDimensionLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => {
      const newFilters = { ...prev, [key]: value };
      
      // Reset custom dates when period changes
      if (key === 'period' && value !== 'custom') {
        newFilters.fromDate = '';
        newFilters.toDate = '';
      }
      
      if (key === 'category') {
        newFilters.subCategory = '';
      }
      return newFilters;
    });
    
    if (value) {
      let displayName = value;
      if (key === 'category') {
        const category = filterOptions.categories.find(cat => cat.id == value);
        displayName = category ? category.name : value;
      }
      if (key === 'subCategory') {
        const subcategory = filterOptions.subcategories.find(sub => sub.id == value);
        displayName = subcategory ? subcategory.name : value;
      }
      toast.success(`Filter applied: ${key} = ${displayName}`);
    }
  };

  const handleDimensionChange = (value) => {
    setFilters(prev => ({ ...prev, dimension: value }));
    toast.success(`View changed to: ${value.replace('_', ' ')}`);
  };

  const clearFilters = () => {
    setFilters({
      period: 'month', fromDate: '', toDate: '', city: '', area: '',
      category: '', subCategory: '', item: '', dimension: 'city'
    });
    setSearchTerm('');
    toast.success('All filters cleared');
  };


  const clearCityFilter = () => {
    setFilters(prev => ({ ...prev, city: '' }));
    toast.success('City filter cleared');
  };

  const clearAreaFilter = () => {
    setFilters(prev => ({ ...prev, area: '' }));
    toast.success('Area filter cleared');
  };

  const clearCategoryFilter = () => {
    setFilters(prev => ({ ...prev, category: '', subCategory: '' }));
    toast.success('Category and subcategory filters cleared');
  };

  const clearSubCategoryFilter = () => {
    setFilters(prev => ({ ...prev, subCategory: '' }));
    toast.success('Subcategory filter cleared');
  };

  const clearProductFilter = () => {
    setFilters(prev => ({ ...prev, item: '' }));
    toast.success('Product filter cleared');
  };

  const clearDateFilter = () => {
    setFilters(prev => ({ ...prev, fromDate: '', toDate: '' }));
    toast.success('Date filter cleared');
  };

  const refreshData = () => {
    setRefreshing(true);
    fetchDashboardData().finally(() => setRefreshing(false));
    toast.success('Data refreshed');
  };

  const filteredSubcategories = filters.category
    ? filterOptions.subcategories.filter(sub => sub.category_id == filters.category)
    : filterOptions.subcategories;

  const orderTrendsOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { 
        display: true, 
        text: `Order Trends - ${filters.period === 'today' ? 'Today' : filters.period === 'custom' ? 'Custom Period' : filters.period.charAt(0).toUpperCase() + filters.period.slice(1)}` 
      }
    },
    scales: {
      y: { beginAtZero: true, title: { display: true, text: 'Number of Orders' } }
    }
  };

  const revenueTrendsOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { 
        display: true, 
        text: `Revenue Trends - ${filters.period === 'today' ? 'Today' : filters.period === 'custom' ? 'Custom Period' : filters.period.charAt(0).toUpperCase() + filters.period.slice(1)}` 
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true, text: 'Amount (Rs)' },
        ticks: { callback: value => 'Rs. ' + value.toLocaleString() }
      }
    }
  };

  // Safe chart data preparation
  const analyticsChartData = {
    labels: analyticsData.map(item => item.name),
    datasets: [
      {
        label: 'Order Count',
        data: analyticsData.map(item => item.orderCount),
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1
      }
    ]
  };

  const categoryChartData = {
    labels: analyticsData
      .filter(item => ['category', 'sub_category'].includes(filters.dimension))
      .map(item => item.name),
    datasets: [
      {
        label: `Order Count by ${filters.dimension.replace('_', ' ')}`,
        data: analyticsData.map(item => item.orderCount),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1
      }
    ]
  };

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Sales Analytics Dashboard</h2>
          <p className="text-sm text-gray-600 mt-1">
            Real-time analytics with advanced filtering capabilities
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-600">
            {metrics.dateRange && (
              <span>
                {new Date(metrics.dateRange.start).toLocaleDateString()} - {new Date(metrics.dateRange.end).toLocaleDateString()}
              </span>
            )}
          </div>
          <button
            onClick={refreshData}
            disabled={refreshing}
            className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Advanced Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-700">Advanced Filters</h3>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
            <button
              onClick={clearFilters}
              className="px-3 py-1 text-sm bg-gray-500 text-white rounded-md hover:bg-gray-600 flex items-center gap-1"
            >
              <X className="h-4 w-4" />
              Clear All
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Time Period</label>
            <select
              value={filters.period}
              onChange={(e) => handleFilterChange('period', e.target.value)}
              className="w-full border border-gray-300 rounded-md p-2 text-sm"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="half_year">Half Year</option>
              <option value="year">This Year</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          {filters.period === 'custom' && (
            <>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-gray-700">From Date</label>
                  {filters.fromDate && (
                    <button
                      onClick={clearDateFilter}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <input
                  type="date"
                  value={filters.fromDate}
                  onChange={(e) => handleFilterChange('fromDate', e.target.value)}
                  className="w-full border border-gray-300 rounded-md p-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                <input
                  type="date"
                  value={filters.toDate}
                  onChange={(e) => handleFilterChange('toDate', e.target.value)}
                  className="w-full border border-gray-300 rounded-md p-2 text-sm"
                />
              </div>
            </>
          )}
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-gray-700">City</label>
                {filters.city && (
                  <button
                    onClick={clearCityFilter}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    Clear
                  </button>
                )}
              </div>
              <select
                value={filters.city}
                onChange={(e) => handleFilterChange('city', e.target.value)}
                className="w-full border border-gray-300 rounded-md p-2 text-sm"
              >
                <option value="">All Cities</option>
                {filterOptions.cities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-gray-700">Area</label>
                {filters.area && (
                  <button
                    onClick={clearAreaFilter}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    Clear
                  </button>
                )}
              </div>
              <select
                value={filters.area}
                onChange={(e) => handleFilterChange('area', e.target.value)}
                className="w-full border border-gray-300 rounded-md p-2 text-sm"
              >
                <option value="">All Areas</option>
                {filterOptions.areas.map(area => (
                  <option key={area} value={area}>{area}</option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-gray-700">Category</label>
                {filters.category && (
                  <button
                    onClick={clearCategoryFilter}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    Clear
                  </button>
                )}
              </div>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full border border-gray-300 rounded-md p-2 text-sm"
              >
                <option value="">All Categories</option>
                {filterOptions.categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-gray-700">Sub Category</label>
                {filters.subCategory && (
                  <button
                    onClick={clearSubCategoryFilter}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    Clear
                  </button>
                )}
              </div>
              <select
                value={filters.subCategory}
                onChange={(e) => handleFilterChange('subCategory', e.target.value)}
                className="w-full border border-gray-300 rounded-md p-2 text-sm"
              >
                <option value="">All Sub Categories</option>
                {filteredSubcategories.map(sub => (
                  <option key={sub.id} value={sub.id}>{sub.name}</option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-gray-700">Product Name</label>
                {filters.item && (
                  <button
                    onClick={clearProductFilter}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    Clear
                  </button>
                )}
              </div>
              <select
                value={filters.item}
                onChange={(e) => handleFilterChange('item', e.target.value)}
                className="w-full border border-gray-300 rounded-md p-2 text-sm"
              >
                <option value="">All Products</option>
                {filterOptions.productNames.map(product => (
                  <option key={product} value={product}>{product}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {(filters.city || filters.area || filters.category || filters.subCategory || filters.item || filters.fromDate || filters.toDate) && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <h4 className="text-sm font-medium text-blue-800 mb-2">Active Filters:</h4>
            <div className="flex flex-wrap gap-2">
              {filters.city && (
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full flex items-center gap-1">
                  City: {filters.city}
                  <button onClick={clearCityFilter} className="text-blue-600 hover:text-blue-800">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {filters.area && (
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full flex items-center gap-1">
                  Area: {filters.area}
                  <button onClick={clearAreaFilter} className="text-blue-600 hover:text-blue-800">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {filters.category && (
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full flex items-center gap-1">
                  Category: {filterOptions.categories.find(c => c.id == filters.category)?.name || filters.category}
                  <button onClick={clearCategoryFilter} className="text-blue-600 hover:text-blue-800">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {filters.subCategory && (
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full flex items-center gap-1">
                  Sub Category: {filterOptions.subcategories.find(s => s.id == filters.subCategory)?.name || filters.subCategory}
                  <button onClick={clearSubCategoryFilter} className="text-blue-600 hover:text-blue-800">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {filters.item && (
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full flex items-center gap-1">
                  Product: {filters.item}
                  <button onClick={clearProductFilter} className="text-blue-600 hover:text-blue-800">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {(filters.fromDate || filters.toDate) && (
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full flex items-center gap-1">
                  Date: {filters.fromDate || 'Start'} to {filters.toDate || 'End'}
                  <button onClick={clearDateFilter} className="text-blue-600 hover:text-blue-800">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
           <LoadingSpinner size="lg" />
          </div>
        </div>
      )}

      {!loading && (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
            <DashboardCard 
              title="Active Customers" 
              value={metrics.activeCustomersCount || 0} 
              icon={Users}
              description="Total active customers"
            />
            <DashboardCard 
              title="Total Sales" 
              value={metrics.totalSalesCount || 0} 
              icon={ShoppingCart}
              description="All orders"
            />
            <DashboardCard 
              title="Pending Orders" 
              value={metrics.pendingOrdersCount || 0} 
              icon={Clock}
              description="Orders awaiting confirmation"
            />
            <DashboardCard 
              title="Confirmed Orders" 
              value={metrics.confirmedOrdersCount || 0} 
              icon={CheckCircle}
              description="Orders confirmed"
            />
            <DashboardCard 
              title="Shipped Orders" 
              value={metrics.shippedOrdersCount || 0} 
              icon={Truck}
              description="Orders in transit"
            />
            <DashboardCard 
              title="Delivered Orders" 
              value={metrics.deliveredOrdersCount || 0} 
              icon={Package}
              description="Successfully delivered"
            />
            <DashboardCard 
              title="Cancelled Orders" 
              value={metrics.cancelledOrdersCount || 0} 
              icon={XCircle}
              description="Cancelled orders"
            />
            <DashboardCard 
              title="Total Revenue" 
              value={`Rs. ${Number(metrics.totalDealRevenue || 0).toLocaleString()}`} 
              icon={DollarSign}
              description="From delivered orders only"
            />
            <DashboardCard 
              title="Advance Collected" 
              value={`Rs. ${Number(metrics.totalAdvanceRevenue || 0).toLocaleString()}`} 
              icon={DollarSign}
              description="Advance payments received"
            />
            <DashboardCard 
              title="Success Rate" 
              value={`${metrics.totalSalesCount ? Math.round((metrics.deliveredOrdersCount / metrics.totalSalesCount) * 100) : 0}%`} 
              icon={CheckCircle}
              description="Delivery success ratio"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Order Trends Chart */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4 text-gray-700">Order Trends</h3>
              {orderTrends?.labels && orderTrends.labels.length > 0 ? (
                <Bar data={orderTrends} options={orderTrendsOptions} />
              ) : (
                <div className="text-center text-gray-500 py-12">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p>No order data available for selected filters</p>
                </div>
              )}
            </div>

            {/* Revenue Trends Chart */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4 text-gray-700">Revenue Trends</h3>
              {revenueTrends?.labels && revenueTrends.labels.length > 0 ? (
                <Line data={revenueTrends} options={revenueTrendsOptions} />
              ) : (
                <div className="text-center text-gray-500 py-12">
                  <DollarSign className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p>No revenue data available for selected filters</p>
                </div>
              )}
            </div>

            <div className="bg-white p-6 rounded-lg shadow lg:col-span-2 flex justify-end">
              <div className="flex flex-col">
                <label className="block text-sm font-medium text-gray-700 mb-1">View By</label>
                <select
                  value={filters.dimension}
                  onChange={(e) => handleDimensionChange(e.target.value)}
                  className="w-full border border-gray-300 rounded-md p-2 text-sm"
                >
                  <option value="city">By City</option>
                  <option value="area">By Area</option>
                  <option value="category">By Category</option>
                  <option value="sub_category">By Sub Category</option>
                  <option value="item">By Product</option>
                </select>
              </div>
            </div>

            {/* Analytics Chart */}
            <div className="bg-white p-6 rounded-lg shadow lg:col-span-2">
              <h3 className="text-lg font-semibold mb-4 text-gray-700">
                {filters.dimension === 'category' ? 'Category Analytics' : 
                 filters.dimension === 'sub_category' ? 'Subcategory Analytics' : 
                 `Analytics by ${filters.dimension.replace('_', ' ').toUpperCase()}`}
                {dimensionLoading && (
                  <span className="ml-2 text-sm text-blue-600">Loading...</span>
                )}
              </h3>
              {analyticsData.length > 0 ? (
                <div className="h-64">
                  <Bar 
                    data={['category', 'sub_category'].includes(filters.dimension) ? categoryChartData : analyticsChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { display: true },
                        title: { 
                          display: true, 
                          text: `${filters.dimension.replace('_', ' ')} Distribution - ${filters.period === 'today' ? 'Today' : filters.period === 'custom' ? 'Custom Period' : filters.period.charAt(0).toUpperCase() + filters.period.slice(1)}` 
                        }
                      }
                    }} 
                  />
                </div>
              ) : (
                <div className="text-center text-gray-500 py-12">
                  {/* FIX: Use BarChart3 icon instead of Bar */}
                  <BarChart3 className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p>{dimensionLoading ? 'Loading analytics data...' : 'No data available for selected dimension'}</p>
                </div>
              )}
            </div>
          </div>

          {/* Detailed Analytics Table */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4 text-gray-700">
              Detailed Analytics - {filters.dimension.replace('_', ' ').toUpperCase()} ({filters.period === 'today' ? 'Today' : filters.period === 'custom' ? 'Custom Period' : filters.period.charAt(0).toUpperCase() + filters.period.slice(1)})
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {filters.dimension.replace('_', ' ')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Orders
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Revenue
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Advance Collected
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {analyticsData.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.orderCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        Rs. {Number(item.totalRevenue || 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        Rs. {Number(item.advanceCollected || 0).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}