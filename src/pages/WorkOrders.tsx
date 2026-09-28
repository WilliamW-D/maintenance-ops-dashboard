import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../lib/api';
import { Plus, X } from 'lucide-react';

const workOrderSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  asset_id: z.coerce.number().min(1, 'Asset selection is required'),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
});

type WorkOrderForm = z.infer<typeof workOrderSchema>;

export function WorkOrders() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  // Fetch Work Orders
  const { data: workOrdersData, isLoading: isLoadingWO } = useQuery({
    queryKey: ['work-orders'],
    queryFn: async () => {
      const res = await api.get('/work-orders');
      return res.data.items || [];
    }
  });

  // Fetch Assets for the dropdown
  const { data: assetsData } = useQuery({
    queryKey: ['assets-dropdown'],
    queryFn: async () => {
      const res = await api.get('/assets?limit=100');
      return res.data.items || [];
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: WorkOrderForm) => {
      const res = await api.post('/work-orders', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      setShowForm(false);
      reset();
    }
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<WorkOrderForm>({
    resolver: zodResolver(workOrderSchema),
  });

  const onSubmit = (data: WorkOrderForm) => {
    createMutation.mutate(data);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">Work Orders</h1>
        {!showForm && (
          <button 
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center"
          >
            <Plus className="w-5 h-5 mr-1" />
            Create Work Order
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-slate-900">New Work Order</h2>
            <button onClick={() => { setShowForm(false); reset(); }} className="text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
                <input {...register('title')} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Replace worn out belt" />
                {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea {...register('description')} rows={3} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Provide details about the issue..." />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Target Asset *</label>
                <select {...register('asset_id')} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                  <option value="">-- Select an Asset --</option>
                  {assetsData?.map((asset: any) => (
                    <option key={asset.id} value={asset.id}>
                      {asset.asset_tag} - {asset.name}
                    </option>
                  ))}
                </select>
                {errors.asset_id && <p className="text-red-500 text-xs mt-1">{errors.asset_id.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                <select {...register('priority')} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>

            {createMutation.isError && (
              <div className="text-red-500 text-sm mt-2">
                Failed to create work order. Ensure the asset is not retired.
              </div>
            )}

            <div className="flex justify-end pt-4">
              <button 
                type="submit" 
                disabled={createMutation.isPending}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-70"
              >
                {createMutation.isPending ? 'Saving...' : 'Submit Work Order'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Work Orders Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 font-semibold">ID</th>
                <th className="px-6 py-3 font-semibold">Title</th>
                <th className="px-6 py-3 font-semibold">Asset ID</th>
                <th className="px-6 py-3 font-semibold">Priority</th>
                <th className="px-6 py-3 font-semibold">Status</th>
                <th className="px-6 py-3 font-semibold">Assigned To</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoadingWO ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">Loading work orders...</td>
                </tr>
              ) : workOrdersData?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">No work orders found. Click 'Create Work Order' to start.</td>
                </tr>
              ) : (
                workOrdersData?.map((wo: any) => (
                  <tr key={wo.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium text-slate-900">WO-{wo.id}</td>
                    <td className="px-6 py-4 text-slate-900 font-medium">{wo.title}</td>
                    <td className="px-6 py-4 text-slate-600">Asset #{wo.asset_id}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        wo.priority === 'critical' ? 'bg-red-100 text-red-800' : 
                        wo.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                        wo.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {wo.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${
                        wo.status === 'completed' ? 'bg-green-100 text-green-800' :
                        wo.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                        wo.status === 'cancelled' ? 'bg-slate-100 text-slate-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {wo.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {wo.assigned_to_id ? `Tech #${wo.assigned_to_id}` : 'Unassigned'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
