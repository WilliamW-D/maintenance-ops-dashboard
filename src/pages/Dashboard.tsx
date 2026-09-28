import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { AlertCircle, CheckCircle2, Clock, PackageX } from 'lucide-react';

export function Dashboard() {
  // We'll fetch the recent work orders and assets to derive some stats
  const { data: workOrdersData, isLoading: isLoadingWO } = useQuery({
    queryKey: ['work-orders', { limit: 50 }],
    queryFn: async () => {
      const res = await api.get('/work-orders?limit=50');
      return res.data.items || [];
    }
  });

  const { data: assetsData, isLoading: isLoadingAssets } = useQuery({
    queryKey: ['assets', { limit: 50 }],
    queryFn: async () => {
      const res = await api.get('/assets?limit=50');
      return res.data.items || [];
    }
  });

  const isLoading = isLoadingWO || isLoadingAssets;
  const workOrders = workOrdersData || [];
  const assets = assetsData || [];

  // Calculate stats from real data, or fall back to mock data if empty (for portfolio preview)
  const hasData = workOrders.length > 0 || assets.length > 0;

  const stats = {
    open: hasData ? workOrders.filter((w: any) => w.status === 'open').length : 18,
    critical: hasData ? workOrders.filter((w: any) => w.priority === 'critical').length : 3,
    assetsDown: hasData ? assets.filter((a: any) => a.status === 'out_of_service').length : 4,
    completed: hasData ? workOrders.filter((w: any) => w.status === 'completed').length : 27,
  };

  const statusData = hasData ? [
    { name: 'Open', value: workOrders.filter((w: any) => w.status === 'open').length, color: '#3b82f6' },
    { name: 'In Progress', value: workOrders.filter((w: any) => w.status === 'in_progress').length, color: '#eab308' },
    { name: 'On Hold', value: workOrders.filter((w: any) => w.status === 'on_hold').length, color: '#f97316' },
    { name: 'Completed', value: workOrders.filter((w: any) => w.status === 'completed').length, color: '#22c55e' },
  ] : [
    { name: 'Open', value: 18, color: '#3b82f6' },
    { name: 'In Progress', value: 12, color: '#eab308' },
    { name: 'On Hold', value: 4, color: '#f97316' },
    { name: 'Completed', value: 27, color: '#22c55e' },
  ];

  const recentMaintenance = hasData 
    ? workOrders.slice(0, 5) 
    : [
      { id: 101, title: 'Forklift 01 battery', status: 'completed' },
      { id: 102, title: 'Compressor 02 valve', status: 'in_progress' },
      { id: 103, title: 'Generator 01 oil change', status: 'open' },
    ];

  const highPriority = hasData
    ? workOrders.filter((w: any) => w.priority === 'high' || w.priority === 'critical').slice(0, 5)
    : [
      { id: 104, title: 'Hydraulic leak', priority: 'high', assigned_to_name: 'Alex', status: 'in_progress' },
      { id: 109, title: 'Generator failure', priority: 'critical', assigned_to_name: 'Chris', status: 'open' },
    ];

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
      
      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center space-x-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Open Work Orders</p>
            <p className="text-2xl font-bold text-slate-900">{stats.open}</p>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center space-x-4">
          <div className="p-3 bg-red-100 text-red-600 rounded-lg">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Critical Priority</p>
            <p className="text-2xl font-bold text-slate-900">{stats.critical}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center space-x-4">
          <div className="p-3 bg-orange-100 text-orange-600 rounded-lg">
            <PackageX className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Assets Down</p>
            <p className="text-2xl font-bold text-slate-900">{stats.assetsDown}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center space-x-4">
          <div className="p-3 bg-green-100 text-green-600 rounded-lg">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Completed (30d)</p>
            <p className="text-2xl font-bold text-slate-900">{stats.completed}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 lg:col-span-2">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Work Orders by Status</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData.filter(d => d.value > 0)} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 12 }} />
                <RechartsTooltip cursor={{fill: '#f8fafc'}} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent List */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Recent Maintenance</h2>
          <div className="space-y-4">
            {recentMaintenance.map((item: any) => (
              <div key={item.id} className="flex justify-between items-center pb-3 border-b border-slate-100 last:border-0 last:pb-0">
                <span className="text-sm font-medium text-slate-700 truncate pr-2">{item.title}</span>
                <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap font-medium capitalize ${
                  item.status === 'completed' ? 'bg-green-100 text-green-700' :
                  item.status === 'in_progress' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {item.status.replace('_', ' ')}
                </span>
              </div>
            ))}
            {recentMaintenance.length === 0 && (
              <p className="text-sm text-slate-500 italic">No recent maintenance.</p>
            )}
          </div>
        </div>
      </div>

      {/* High Priority Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-0 overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-900">High Priority Work Orders</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 font-semibold">ID</th>
                <th className="px-6 py-3 font-semibold">Title</th>
                <th className="px-6 py-3 font-semibold">Priority</th>
                <th className="px-6 py-3 font-semibold">Assigned To</th>
                <th className="px-6 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {highPriority.map((item: any) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium text-slate-900">WO-{item.id}</td>
                  <td className="px-6 py-4 text-slate-600">{item.title}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      item.priority === 'critical' ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'
                    }`}>
                      {item.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{item.assigned_to_name || 'Unassigned'}</td>
                  <td className="px-6 py-4 text-slate-600 capitalize">{item.status.replace('_', ' ')}</td>
                </tr>
              ))}
              {highPriority.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500 italic">
                    No high priority work orders.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
